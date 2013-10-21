import $.sampleData.Unemployement;
import $.sampleData.Miserables;
import $.lib;

lib.DemoLinks(DATASET([{'index.html'}], lib.LinksRecord));

output(Unemployement.UnempDataset, named('unemployement'));
output(Miserables.VertexDataset, named('vertices'));
output(Miserables.EdgeDataset, named('edges'));

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

d2 := sort(d(recording_year = '2010'), total)
output(sort(d(recording_year = '2010'), total), {county, total}, named('jo'));
