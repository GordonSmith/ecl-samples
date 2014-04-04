//  Hello World  ---

r := RECORD
  STRING20 message;
END;

d := DATASET([{'Hello'}, {'World'}], r);

OUTPUT(d, NAMED('Messages'));
