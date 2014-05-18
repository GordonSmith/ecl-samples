IMPORT std.Date;
IMPORT Std;

EXPORT DeclareData := MODULE
	SHARED Layout_NDX := RECORD
		STRING date;
		DECIMAL6_2 open;
		DECIMAL6_2 high;
		DECIMAL6_2 low;
		DECIMAL6_2 close;
		INTEGER4 volume;
		STRING oi;
	END;
	
	SHARED NDX_RAW := DATASET('~gjs::stock::ndx', Layout_NDX, CSV);
	
	EXPORT Layout := RECORD(Layout_NDX)
	  STRING2 Quarter;
	  INTEGER4 Year;
	  INTEGER4 Month;
	  INTEGER4 Day;
	  DECIMAL5_2 Fluctuation;
	END;
	
	Layout expandDate(Layout_NDX L) := TRANSFORM
		SELF := L;
		rowDate :=  Date.FromString(L.date, '%m/%d/%Y');
		SELF.Year := Date.Year(rowDate);
		SELF.Month := Date.Month(rowDate);
		SELF.Day := Date.Day(rowDate);
		SELF.Quarter := MAP(SELF.Month <= 3 => 'Q1',
			SELF.Month <= 6 => 'Q2',
			SELF.Month <= 9 => 'Q3',
			SELF.Month <= 12 => 'Q4', 
			'');
		SELF.Fluctuation := ((L.Close - L.Open) / L.Open) * 100;			
	END;
	
	EXPORT NDX := PROJECT(NDX_RAW, expandDate(LEFT));
	
END;
