r := RECORD
  STRING key;
  STRING value;
END;
d := DATASET([
    { 'Title', 'Programmers Guide - CrossTab' }
], r);
OUTPUT(d, NAMED('Meta'));
