EXPORT Ptbl := MODULE
    EXPORT Rec := RECORD
      INTEGER8 sequence;
      STRING2  State;
      STRING20 City;
      STRING25 Lname;
      STRING15 Fname;
    END;
    
    EXPORT DataFileName := '~RTTEMP::TestKeyedJoin';
    
    SHARED rawData1 := DATASET(DataFileName, {Rec, UNSIGNED8 __filepos {virtual(fileposition)}}, FLAT);
    EXPORT rawData := DATASET(DataFileName, Rec, FLAT);
    
    EXPORT AlphaKey := INDEX(rawData1, {lname, fname, __filepos}, '~RTTEMP::lname.fnameKey');
    EXPORT AlphaPay := INDEX(rawData, {lname, fname}, {rawData}, '~RTTEMP::lname.fnameKeyPay');
END;
