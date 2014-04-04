IMPORT $.ProgGuide.CrossTab;

EXPORT StateSummary2 := FUNCTION
    STRING2 st_value := '' : STORED('StateID');

    Fetched := IF(st_value = '',
                    CrossTab.RepTable2,
                    CrossTab.RepTable2(state = st_value));
    RETURN OUTPUT(Fetched, , NAMED('Result'));
END;
