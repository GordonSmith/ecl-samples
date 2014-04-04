//
//  Example code - use without restriction.  
//
IMPORT $;

EXPORT CrossTab := MODULE
    SHARED Person := $.DeclareData.PersonAccounts;

    SHARED CountAccts := COUNT(Person.Accounts);

    EXPORT MyReportFormat := RECORD
        State        := Person.State;
        A1           := SUM(GROUP, CountAccts);
        GroupCount   := COUNT(GROUP);
    END;


    SHARED RepTableFile := '~PROGGUIDE::EXAMPLEDATA::Crosstab::RepTable';
    outTable := TABLE(Person, MyReportFormat, state);
    EXPORT createRepTable := OUTPUT(outTable,, RepTableFile, OVERWRITE);
    EXPORT RepTable := DATASET(RepTableFile, MyReportFormat, FLAT); 

    EXPORT MyReportFormat2 := RECORD
        State  := Person.State;
        A1      := CountAccts;
        GroupCount  := COUNT(GROUP);
        MaleCount   := COUNT(GROUP,Person.Gender = 'M');
        FemaleCount := COUNT(GROUP,Person.Gender = 'F');
     END;
    
    SHARED RepTableFile2 := '~PROGGUIDE::EXAMPLEDATA::Crosstab::RepTable2';
    outTable2 := TABLE(Person,MyReportFormat2,State,CountAccts);
    EXPORT createRepTable2 := OUTPUT(outTable2,, RepTableFile2, OVERWRITE);
    EXPORT RepTable2 := DATASET(RepTableFile2, MyReportFormat2, FLAT);
    EXPORT Main := SEQUENTIAL(createRepTable, createRepTable2);
END;

 