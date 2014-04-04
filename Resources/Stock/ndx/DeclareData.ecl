IMPORT Std;

EXPORT DeclareData := MODULE
	EXPORT Layout_NDX := RECORD
		STRING date;
		DECIMAL6_2 open;
		DECIMAL6_2 high;
		DECIMAL6_2 low;
		DECIMAL6_2 close;
		INTEGER4 volume;
		STRING oi;
	END;
	EXPORT NDX := DATASET('~gjs::stock::ndx', Layout_NDX, CSV);
END;
