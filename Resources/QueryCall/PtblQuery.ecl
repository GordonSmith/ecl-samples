IMPORT $.Ptbl;

STRING10 LNameFilter := 'SMITH' : STORED('LName');
resultSet := FETCH(Ptbl.rawData, Ptbl.AlphaKey(Lname=LNameFilter), RIGHT.__filepos);
OUTPUT(resultset, NAMED('LNameResults'));
