#!/bin/sh
#python calc_agreement.py --dbname textprizm --maxsegtime 0 0sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 1 1sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 5 5sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 10 10sec.csv

python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 1 ../website/data/1line.csv ../website/data/users1.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 5 ../website/data/5line.csv ../website/data/users5.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 10 ../website/data/10line.csv ../website/data/users10.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 15 ../website/data/15line.csv ../website/data/users15.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 20 ../website/data/20line.csv ../website/data/users20.csv

