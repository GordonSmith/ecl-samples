IMPORT $.ProgGuide.CrossTab;

EXPORT StateSummary := FUNCTION
    STRING2 st_value := '' : STORED('StateID');

    Fetched := IF(st_value = '',
                    CrossTab.RepTable,
                    CrossTab.RepTable(state = st_value));
    RETURN OUTPUT(Fetched, , NAMED('Result'));
END;
