import $.sampleData.Unemployement;
import $.sampleData.Miserables;
import $.lib;

lib.DemoLinks(DATASET([{'index.html'}, {'Choropleth.html'}], lib.LinksRecord));

r := RECORD
  string st;
  string county;
  integer8 total;
  string recording_year;
  integer8 default_total;
  integer8 __recordcount;
  integer8 still_in_default_total;
  integer8 default_cleared_total;
 END; 

d := dataset('~viz::deeds_stats2', r, CSV);

//string year := '' : STORED('year');
//resultSet := d(recording_year = year);
//OUTPUT(resultset, named('jo_orig'));
//output(d, named('jo_orig'));
output(d(recording_year = '2012' or recording_year = '2013'), named('jo_2'));
output(d, named('jo_all'));

/*
output(Unemployement.UnempDataset, named('unemployement'));
output(Miserables.VertexDataset, named('vertices'));
output(Miserables.EdgeDataset, named('edges'));
*/

