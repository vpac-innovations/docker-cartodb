#!/bin/bash

FILES=/data/*.zip
for f in $FILES
do
  echo "Processing $f file..."
  # take action on each file. $f store current file name
  rake cartodb:import[common-data,$f]
done

echo "UPDATE visualizations SET privacy = 'public';" | psql -U postgres -h postgres -d carto_db_development
# GRANT imported table to SELECT access
COMMON_DATA_DATABASE=`psql -U postgres -h postgres -d carto_db_development -t -c "SELECT database_name FROM users WHERE username='common-data';"`

echo "GRANT SELECT ON public.sa1_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.sa2_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.sa3_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.sa4_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.lga11aaust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.ced_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.sed_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "GRANT SELECT ON public.poa_2011_aust TO publicuser;" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE

echo "DELETE FROM public.sa1_2011_aust WHERE ste_code11<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.sa2_2011_aust WHERE ste_code11<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.sa3_2011_aust WHERE ste_code11<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.sa4_2011_aust WHERE ste_code11<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.lga11aaust WHERE state_code<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.ced_2011_aust WHERE LEFT(ced_code, 1)<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.sed_2011_aust WHERE LEFT(sed_code, 1)<>'2';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE
echo "DELETE FROM public.poa_2011_aust WHERE LEFT(poa_code, 1)<>'3';" | psql -U postgres -h postgres -d $COMMON_DATA_DATABASE

echo "UPDATE external_sources SET size=74399488 WHERE size >= 174399488;" | psql -U postgres -h postgres -d carto_db_development

rake cartodb:remotes:invalidate_common_data