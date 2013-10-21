IMPORT $;

//  This is a workaround until ECL Watch supports listing resources  ---
EXPORT DemoLinks(DATASET($.LinksRecord) webPages) := FUNCTION

	HyperLinksRecord := RECORD
		STRING link__javascript;
	END;

	HyperLinksRecord toHyperLinks($.LinksRecord L) := TRANSFORM
		SELF.link__javascript := '__cell.innerHTML = "<a href=\'/WsWorkunits/res/" + this.Wuid + "/' + L.webPageName + '\' target=\'_blank\'>' + L.webPageName + '</a>";';
	END;

	RETURN OUTPUT(PROJECT(webPages, toHyperLinks(LEFT)), NAMED('DemoLinks'));
END; 
