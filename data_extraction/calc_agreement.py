#
# calculate
#
#
#
#
#
#

import os
import sys
import simplejson
import datetime
import MySQLdb
import getpass
import collections
from MySQLdb import cursors
import csv
import argparse

#
#
# defines
#
#


DBHOST = 'localhost'
DBUSER = 'root'
DBPASS = 'blahhalb'
DBNAME = 'textprizm'


SELECT_INSTANCES_QUERY = """select dp.id as message_id, dp.participant_id as participant, dp.time as message_time, ci.user_id as user_id, ci.code_id as code_id, ci.added as date_added from data_points dp
inner join coding_instances ci on ci.message_id = dp.id
inner join coding_codes cc on cc.id = ci.code_id
where cc.schema_id = 2 and cc.id not in (117,118,119,120,121,122,123,124,126)
group by dp.id, ci.user_id
order by dp.time desc"""


#
# helper functions
#
def pretty(obj):
	return simplejson.dumps(obj, sort_keys=True, indent=2)



#
#
# Check Args
#
#

	# add args
parser = argparse.ArgumentParser()
parser.add_argument("outfile", type=str, help="name of the csv outfile")
parser.add_argument("--maxsegtime", type=int, help="maximum segment time size", default=5)
parser.add_argument("--maxlines", type=int, help="maximum number of lines in a segment", default=5)
parser.add_argument("--dbhost", help="Database host name", default=DBHOST)
parser.add_argument("--dbuser", help="Database user name", default=DBUSER)
parser.add_argument("--dbname", help="Database name", default=DBNAME)


	# parse args
args = parser.parse_args()




	# grab db password
if DBPASS is None:
	DBPASS = getpass.getpass('enter database password: ')


#
#
# Classes
#
#

class ETCRow:
	'''Wrapper around the database row'''
	def __init__(self, row):
		self.id = row[0]
		self.participant_id = row[1]
		self.time = row[2]
		self.user_id = row[3]
		self.code_id = row[4]
		self.code_added_time = row[5]

	def __str__(self):
		return "ETCRow( id:%d, pid: %d, time: %s, user: %d, code: %d, added: %s)"%(
			self.id,
			self.participant_id,
			self.time.isoformat(' '),
			self.user_id,
			self.code_id,
			self.code_added_time.isoformat(' '))


class ETCUserCodes:
	'''Holds a set of codes for the user'''
	def __init__(self, row):
		self.id = row.user_id
		self.name = None
		self.codes = {}
		self.Add(row.code_id, row.code_added_time)

	def Add(self,code,time):
		# add to the code_set
		if code not in self.codes:
			self.codes[code] = [time]
		else:
			self.codes[code].append(time)



class ETCDatapoint:
	'''An individiual line with all codes from the users'''
	def __init__(self, row):
		self.id = row.id
		self.participant_id = row.participant_id
		self.time = row.time
		self.users = {}

		self.users[row.user_id] = ETCUserCodes(row)


	def AddRow(self,row):
		if row.user_id not in self.users:
			self.users[row.user_id] = ETCUserCodes(row)
		else:
			self.users[row.user_id].Add(row.code_id, row.code_added_time)



class Segment:
	''' A container for a segment of datapoints'''
	def __init__(self, dp):
		self.datapoints = [dp]
		self.time = dp.time
		self.max_time = dp.time
		self.participant_id = dp.participant_id


	def AddDatapoint(self,dp):
		if len(self.datapoints) == 0:
			self.time = dp.time

		if dp.time > self.max_time:
			self.max_time = dp.time

		self.datapoints.append(dp)

#	def GetUniqueUsers(self):
#		users = set()
#		for u in self.datapoints:
#			u.

	def __str__(self):
		return "Segment for %s- %s by %d - datapoints: %d"%(self.time.isoformat(' '), self.max_time.isoformat(' '),self.participant_id, len(self.datapoints))


class TimeSegmenter:
	'''A class for segmenting the data'''
	def __init__(self, time_threshold = 5):
		self.segments = []
		self.active_segments = []
		self.current_time = datetime.datetime.min
		self.time_threshold = time_threshold



	def PruneSegments(self):
		#print "active segments: %d"%(len(self.active_segments))
		while len(self.active_segments) > 0:
			time_delta = abs(self.current_time - self.active_segments[0].time)
			#print "%s - %s = %d"%(self.current_time, self.active_segments[0].time, time_delta.total_seconds())
			if time_delta is not None and time_delta.total_seconds() > self.time_threshold:
				dp = self.active_segments.pop(0)
				self.segments.append(dp)
			else:
				break



	def FindActiveSegment(self, dp):
		for s in self.active_segments:
			if s.participant_id == dp.participant_id:
				return s



	def AddDatapoint(self, dp):
		self.current_time = dp.time

		# first remove any aged out segments
		self.PruneSegments()

		# try to find a segment and append it
		s = self.FindActiveSegment(dp)
		if s is not None:
			s.AddDatapoint(dp)
		else:
			s = Segment(dp)
			self.active_segments.append(s)


class Segmenter:
	'''Segment data by having X datapoints'''
	def __init__(self, line_threshold = 5):
		self.segments = []
		self.active_segment = None
		self.current_id = -1
		self.line_threshold = line_threshold

	def PruneSegments(self):
		#print "active segments: %d"%(len(self.active_segments))
		if self.active_segment is not None:
			if len(self.active_segment.datapoints) >= self.line_threshold:
				self.segments.append(self.active_segment)
				self.active_segment = None



	def AddDatapoint(self, dp):
		self.current_time = dp.time

		# first remove any aged out segments
		self.PruneSegments()

		# try to find a segment and append it
		if self.active_segment is not None:
			self.active_segment.AddDatapoint(dp)
		else:
			self.active_segment = Segment(dp)



class AgreementCalculator:
	'''Class to caclulate the agreement'''
	def __init__(self, segments):
		self.segments = segments


	def BuildSegmentSets(self, segment):
		users = {}

		# step through datapoints
		for dp in segment.datapoints:
			# from each datapoint, grab the userid and codes and join them
			for id, codes in dp.users.items():
				if id not in users:
					users[id] = set()
				users[id] |= set(codes.codes.keys())

		# return the results
		return users

	def CalculateSegmentAgreement(self, users):
		pairs = {}
		numusers = len(users)
		for i in range(0,numusers):
			for j in range(i+1,numusers):
				user_ids = [users.keys()[i], users.keys()[j]]
				user1 = min(user_ids)
				user2 = max(user_ids)
				pair_id = "%d-%d"%(user1,user2)

				# agreed codes is the intersection of the two
				agreed_codes = len(set(users[user1] & users[user2]))

				# disagreed codes are the symmetric difference
				disagreed_codes = len(set(users[user1] ^ users[user2]))

				#print "agreed: %d | disagreed: %d"%(agreed_codes,disagreed_codes)

				if (agreed_codes + disagreed_codes) > 0:
					# calculate the total agreement
					pct_agreement = float(agreed_codes) / float(agreed_codes + disagreed_codes)

					# add to our dictionary
					pairs[pair_id] = pct_agreement
		return pairs



	def CalcAgreementBySegments(self):
		results = []
		for s in self.segments:
			users = self.BuildSegmentSets(s)
			pairs = self.CalculateSegmentAgreement(users)

			#print users
			#print users.keys()
			#print pairs
			#print pairs.values()
			user_ids = ' '.join(str(v) for v in users.keys())
			pct_agreements = ', '.join(str(v) for v in pairs.values())

			row = {'id': s.datapoints[0].id, 'time': s.datapoints[0].time}
			#print row
			#print pairs
			row.update(pairs)
			results.append(row)
			#print "%s:%s"%(user_ids, pct_agreements)
		return results






#
#
# global vars
#
#

data_points = {}
unique_users = set()



# ================================================================
#
#
# begin main
#
#
# ================================================================


print "Connecting to db... (%s@%s %s)"%(args.dbuser,args.dbhost, args.dbname)
db = MySQLdb.connect(host=args.dbhost, user=args.dbuser, passwd=DBPASS, db=args.dbname, charset='utf8', use_unicode=True)
cursor = db.cursor(cursors.SSCursor)

cursor.execute(SELECT_INSTANCES_QUERY)
cnt = 0
dbrow = cursor.fetchone() 
while dbrow is not None: # and cnt < 5:
    # process

    row = ETCRow(dbrow)
    unique_users.add(row.user_id)
    
    if row.id not in data_points:
    	data_points[row.id] = ETCDatapoint(row)
    else:
    	dp = data_points[row.id]
    	dp.AddRow(row)

    dbrow = cursor.fetchone()
    cnt+=1

    #if cnt%100:
    #	print "    %d"%cnt

cursor.close()
db.close() 

print "Segmenting... (maxtime=%d, maxlines=%d)"%(args.maxlines, args.maxlines)
segmenter = Segmenter(args.maxlines)

for dp,k in data_points.items():
	if len(k.users) > 1:
		#print dp, k
		segmenter.AddDatapoint(k)


print "%d segments"%(len(segmenter.segments))
maxseg = 0
minusers = 0
maxusers = 0
for dp in segmenter.segments:
	maxseg = max(maxseg, len(dp.datapoints))
	#print dp
	#minusers = min(minusers, dp.users)

print "max segment length: %d msgs"%maxseg

#user_matrix = dict(zip(sorted(unique_users), [None] * len(unique_users)))
#for k,v in unique_users.items():
#	unique_users[]
#print pretty(user_matrix)

agreementcalc = AgreementCalculator(segmenter.segments)
results = agreementcalc.CalcAgreementBySegments()

fieldnames = ['id','time']
for i in range(1,22):
	for j in range(i+1, 22):
		fieldnames.append('%d-%d'%(i,j))

data_file = open(args.outfile, "wt")
csvwriter = csv.DictWriter(data_file, delimiter=",", fieldnames=fieldnames)
csvwriter.writerow(dict((fn,fn) for fn in fieldnames))
for row in results:
	csvwriter.writerow(row)




