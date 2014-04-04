IMPORT $.ProgGuide;

EXPORT PersonSearch := FUNCTION
	STRING30 lname_value := '' : STORED('LastName');
	STRING30 fname_value := '' : STORED('FirstName');

	IDX := ProgGuide.DeclareData.IDX__Person_LastName_FirstName;
	Base := ProgGuide.DeclareData.Person.FilePlus;
	Fetched := IF(fname_value = '',
					FETCH(Base, IDX(LastName=lname_value), RIGHT.RecPos),
					FETCH(Base, IDX(LastName=lname_value, FirstName=fname_value), RIGHT.RecPos));
	RETURN OUTPUT(CHOOSEN(Fetched,25));
END;
