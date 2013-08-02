import $.CellFormatter;

PeopleRecord := RECORD
  unsigned3 personid;
  qstring15 firstname;
  qstring25 lastname;
  string1 middleinitial;
  string1 gender;
  qstring42 street;
  qstring20 city;
  string2 state;
  qstring5 zip;
 END;
 
PeopleDataset := dataset('~progguide::exampledata::people', PeopleRecord, thor);
 
MiddleInitialStatRecord := RECORD
  string2 state;
	string1 middleinitial;
  INTEGER4 stat;
END;

MiddleInitialStatRecord PrimeStats(PeopleRecord L) := TRANSFORM
  SELF.stat := 1;
  SELF := L;
END;

PeopleStatsDataset := project(PeopleDataset, PrimeStats(LEFT));
SortedTable := SORT(PeopleStatsDataset, middleinitial); //sort it first

MiddleInitialStatRecord calcStat(MiddleInitialStatRecord L, MiddleInitialStatRecord R) := TRANSFORM
  SELF.stat := L.stat + 1;
  SELF := L;
END;

XtabOut := ROLLUP(SortedTable(state='FL'), LEFT.middleinitial=RIGHT.middleinitial, calcStat(LEFT,RIGHT)); 

r2 := record
  string10 id;
	dataset(MiddleInitialStatRecord) _data__hiddenX;
	varstring pie__javascript;
	varstring bubble__javascript;
end;

d3 := CellFormatter.d3('_data__hiddenx', 'middleinitial', 'stat');
//dataset([{'1', XtabOut, [], []}], r2);
d2 := dataset([{'1', XtabOut, d3.pie, d3.bubble}], r2);
d2;


/*



StateTable := table(PeopleDataset, {state});
States := dedup(sort(StateTable, RECORD), RECORD);
States;

ZipRecord := record
	string2 state;
	qstring2 zip2;
end;

ZipRecord zip2Trans(PeopleRecord L) := transform
	self.state := L.state;
	self.zip2 := L.zip[1..2];
end;

ZipTable := project(PeopleDataset, zip2Trans(LEFT));
Zips := dedup(sort(ZipTable, RECORD), RECORD);
count(Zips);
Zips;

OutRecord := record
  string2 state;
	dataset(PeopleRecord) people;
end;
*/
/*

CityRecord := record
  qstring20 city;
	dataset(PeopleRecord) 
end;

ZipRecord := record
  qstring5 zip;
	//dataset(CityRecord) cities;
end;

StatesRecord := record
  string2 state;
	dataset(ZipRecord) zips;
end;

SortedPeople := SORT(PeopleDataset, state, zip); //sort it first

StatesRecord denormPeople(PeopleRec L) := transform
end;

StatesDataset := 
 
PepoleStatsRecord := RECORD
	PeopleRecord;
  INTEGER4 stat;
END;

PepoleStatsRecord PrimeStats(PeopleRecord L) := TRANSFORM
  SELF.stat := 1;
  SELF := L;
END;

PepoleStatsDataset := project(PeopleDataset, PrimeStats(LEFT));

LnameTable := TABLE(PeopleDataset, MyRec); //create dataset to work with
SortedTable := SORT(PeopleDataset, state, middleinitial); //sort it first

MyRec Xform(MyRec L, MyRec R) := TRANSFORM
  SELF.PersonCount := L.PersonCount + 1;
  SELF := L;
END;

XtabOut := ROLLUP(SortedTable(state='FL'), LEFT.middleinitial=RIGHT.middleinitial, Xform(LEFT,RIGHT)); 

r2 := record
  string10 id;
	dataset(MyRec) _data__hiddenX;
	varstring pie__javascript;
	varstring bubble__javascript;
end;

d3 := CellFormatter.d3('_data__hiddenX', 'middleinitial', 'personcount');
d2 := dataset([{'1', XtabOut, d3.pie, d3.bubble}], r2);
d2;
//D3Bundle.pie(XtabOut, middleinitial, PersonCount)._output;
//D3Bundle.bubble(XtabOut, middleinitial, PersonCount)._output;
//D3Bundle.pie(XtabOut, middleinitial, PersonCount)._output;
*/