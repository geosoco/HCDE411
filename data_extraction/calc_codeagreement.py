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
DBPASS = None
DBNAME = 'textprizm'

#


SELECT_CODE_AGREEMENT_QUERY = """select a.day, a.id, avg(a.num_coders) avg_num_coders, sum(a.num_codes) as num_codes, count(a.id) as used_on_lines,  avg(a.pct) as pct from 
	(select p.day, p.id, count(ci.user_id) as num_coders, p.num_codes, p.num_codes*100/count(ci.user_id) as pct from textprizm.coding_instances ci
	inner join 
		(select date(ci.added) as day, dp.id as `id`, count(distinct ci.id) `num_codes` from textprizm.data_points dp
		inner join textprizm.coding_instances ci on ci.message_id = dp.id
		where ci.code_id = %s
		group by day, dp.id) p 
		on p.id = ci.message_id
	where date(ci.added) <= p.day
	group by p.day, p.id) a
where a.num_coders > 1
group by a.day
order by a.day, a.id
"""


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
parser.add_argument("--dbhost", help="Database host name", default=DBHOST)
parser.add_argument("--dbuser", help="Database user name", default=DBUSER)
parser.add_argument("--dbname", help="Database name", default=DBNAME)


	# parse args
args = parser.parse_args()




	# grab db password
if DBPASS is None:
	DBPASS = getpass.getpass('enter database password: ')


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


# grab codes
code_values = []
codes = [113, 77, 81, 84, 80, 83, 73, 96, 94, 74, 89, 79, 99]
for code in codes:
	cursor.execute(SELECT_CODE_AGREEMENT_QUERY, (code))
	dbrow = cursor.fetchone()
	while dbrow is not None:
		code_values.append([code, dbrow[0].isoformat(), dbrow[1], dbrow[2], dbrow[3], dbrow[4], dbrow[5]])
		dbrow = cursor.fetchone()

cursor.close()
db.close() 

fieldnames=['code', 'day','id','avg_num_coders', 'num_codes', 'used_on_lines', 'percent']
with open(args.outfile, "wt") as data_file:
	csvwriter = csv.writer(data_file, delimiter=",")
	csvwriter.writerow(fieldnames)
	for row in code_values:
		csvwriter.writerow(row)



