#!/bin/sh
#python calc_agreement.py --dbname textprizm --maxsegtime 0 0sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 1 1sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 5 5sec.csv
#python calc_agreement.py --dbname textprizm --maxsegtime 10 10sec.csv

python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 1 ../website/data/1line.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 5 ../website/data/5line.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 10 ../website/data/10line.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 15 ../website/data/15line.csv
python ../data_extraction/calc_agreement.py --dbname textprizm --maxlines 20 ../website/data/20line.csv

