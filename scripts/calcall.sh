#!/bin/sh
#python calc_agreement.py --dbname textprizm --maxsegtime 0 0sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 1 1sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 5 5sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 10 10sec.csv

python calc_agreement.py --dbname textprizm --maxlines 1 1line.csv
python calc_agreement.py --dbname textprizm --maxlines 5 5line.csv
python calc_agreement.py --dbname textprizm --maxlines 10 10line.csv

