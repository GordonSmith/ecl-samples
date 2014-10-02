IMPORT std.Date;
IMPORT Std;

DeclareData := MODULE
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
	  STRING10 UTCDate;
	  DECIMAL5_2 Fluctuation;
	END;
	
	Layout expandDate(Layout_NDX L) := TRANSFORM
		SELF := L;
		rowDate :=  Date.FromString(L.date, '%m/%d/%Y');
		SELF.Year := Date.Year(rowDate);
		SELF.Month := Date.Month(rowDate);
		SELF.Day := Date.Day(rowDate);
		SELF.UTCDate := SELF.Year + '-' + INTFORMAT(SELF.Month, 2, 1) + '-' + INTFORMAT(SELF.Day, 2, 1);
		SELF.Quarter := MAP(SELF.Month <= 3 => 'Q1',
			SELF.Month <= 6 => 'Q2',
			SELF.Month <= 9 => 'Q3',
			SELF.Month <= 12 => 'Q4', 
			'');
		SELF.Fluctuation := ((L.Close - L.Open) / L.Open) * 100;			
	END;
	
	EXPORT NDX := PROJECT(NDX_RAW, expandDate(LEFT));
END;

YearCountRec:=RECORD
  YearID := DeclareData.NDX.Year;
  TradeTotal := sum(GROUP, DeclareData.NDX.volume);
END;
YearSummary:= TABLE(DeclareData.NDX,YearCountRec,Year);
OUTPUT(YearSummary, NAMED('YearSummary'));

INTEGER4 in_year := 0 : STORED('year');
STRING2 in_quarter := '' : STORED('quarter');
INTEGER4 in_month := 0 : STORED('month');
INTEGER4 in_day := 0 : STORED('day');

ndx := SORT(DeclareData.NDX(
	(in_year = 0 OR in_year = Year) AND
	(in_quarter = '' OR in_quarter = Quarter) AND
	(in_month = 0 OR in_month = Month) AND
	(in_day = 0 OR in_day = Day)), UTCDate);

OUTPUT(ndx, {UTCDate, open, close, high, low},NAMED('ndx'), ALL);

QuarterCountRec:=RECORD
  QuarterID := DeclareData.NDX.Quarter;
  TradeTotal := sum(GROUP, DeclareData.NDX.volume);
END;
QuarterSummary:= TABLE(DeclareData.NDX(in_year = 0 OR in_year = Year), QuarterCountRec, Quarter);
OUTPUT(SORT(QuarterSummary, QuarterID), NAMED('QuarterSummary'));

MonthCountRec:=RECORD
  MonthID := DeclareData.NDX.Month;
  TradeTotal := sum(GROUP, DeclareData.NDX.volume);
END;
MonthSummary:= TABLE(DeclareData.NDX((in_year = 0 OR in_year = Year) AND (in_quarter = '' OR in_quarter = Quarter)), MonthCountRec, Month);
OUTPUT(MonthSummary, NAMED('MonthSummary'));

