r := RECORD
  STRING key;
  STRING value;
END;
d := DATASET([
    { 'URL', 'http://10.239.227.24:8002/WsEcl/submit/query/roxie/fetch_ins12_stats/json' }
], r);
OUTPUT(d, NAMED('Meta'));
