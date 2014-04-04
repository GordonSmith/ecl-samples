IMPORT $.Ptbl;

Temp := DATASET([   {3000,'FL','BOCA RATON','LONDON','BARIDGE'},
                    {35,'FL','BOCA RATON','SMITH','FRANK'},
                    {50,'FL','BOCA RATON','SMITH','SUE'},
                    {135,'FL','BOCA RATON','SMITH','NANCY'},
                    {235,'FL','BOCA RATON','SMITH','FRED'},
                    {335,'FL','BOCA RATON','TAYLOR','FRANK'},
                    {3500,'FL','BOCA RATON','JONES','FRANK'},
                    {30,'FL','BOCA RATON','TAYLOR','RICHARD'}], Ptbl.Rec);

Proj := SORT(temp,sequence);

createRawData := OUTPUT(Proj, , Ptbl.DataFileName, OVERWRITE);
createAlphaKey := BUILD(Ptbl.AlphaKey, OVERWRITE);
createAlphaPay := BUILD(Ptbl.AlphaPay, OVERWRITE);

SEQUENTIAL(createRawData, PARALLEL(createAlphaKey, createAlphaPay));
