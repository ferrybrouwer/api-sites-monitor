Monitor
=======

Monitor bestaat 3 secties, welke los staan van elkaar:

- RESTful Webserver API 
- Sites tester
- Een visuele schil

----

## RESTful Webserver API
De webserver draait als een *node process* welke altijd ge-runned wordt, door [foreverJS](https://github.com/foreverjs/forever). Dit houd in dat wanneer dit process door welke omstandigheden dan ook gestopt wordt, deze automatisch weer gespawned wordt, zodat de webserver ten alle tijden beschikbaar is. 

Zie [API webservers](https://strongloop.com/strongblog/compare-express-restify-hapi-loopback/) waarom er gekozen is voor [Loopback](http://loopback.io) i.p.v. [ExpressJS](http://expressjs.com). Voornaamste reden is de opzet van de LoopBack framework design pattern [ORM](http://en.wikipedia.org/wiki/Object-relational_mapping).

> Powerful Node.js framework for creating APIs and easily connecting to backend data sources.


### Doel
Het doel van deze webserver is data-management over de performance van sites. Data moet via een API kunnen worden opgehaald, opgeslagen, bewerkt en verwijderd kunnen worden middels de door de webserver vastgestelde endpoints. 


### Security
De gebruiker zal zich moeten identificeren middels oAuth2 om gebruik te kunnen maken van de api. Dit om te voorkomen dat niet geauthentificeerde gebruikers data kunnen ophalen over de performance van onze site. Op deze wijze houden wij zelf controle op wie data ophaald via onze webserver.


### MongoDB
Er is gekozen voor MongoDB als database, omdat data gecommuniceerd wordt middels json en daarom geen wrapper nodig is om deze te vertalen naar bijvoorbeeld een Query georienteerde database. Hierdoor is de response een stuk sneller. Een groot nadeel van MongoDB is dat deze geen relaties d.m.v. met foreign keys. 


Een voorbeeld van de database structuur:


`site`

	{
	    "_id": 1,
	    "name": "Happy Online",
	    "url": "http://www.happy-online.nl"
	}
	
	
`form_type`

	{
		"_id": 1,
		"casperjs_path": "/home/monitor/site-tester/casperjs/wpcf7.js",
		"description": "Test ContactForm7 Forms for WordPress"
	}
	
	
`site_form`

	{
		"_id": 1,
		"site_id": 1,
		"form_type_id": 1,
		"form_path": "//*[@id="wpcf7-f247-o1"]/form",
		"root_url": "/contact"
	}
	
	
`site_test`

	{
		"_id": 1,
		"test_date": ISODate("2010-09-24"),
		"psi": 1,
		"ping": 1,
		"forms": [1, 2, 3]
	}
	

`site_test_psi`

	{
	    "_id": 1,
	    "site_id": 1,
	    "published_date": ISODate("2010-09-24"),
	    "overview": {
	        "url": "happy-online.nl",
	        "strategy": "mobile",
	        "score": 56
	    },
	    "statistics": {
	        "css_response_bytes": "351 kB",
	        "html_response_bytes": "85.29 kB",
	        "image_response_bytes": "1.09 MB",
	        "javascript_response_bytes": "543.4 kB",
	        "number_css_resources": 1,
	        "number_hosts": 6,
	        "number_js_resources": 9,
	        "number_resources": 42,
	        "number_static_resources": 29,
	        "text_response_bytes": "429.72 kB",
	        "total_request_bytes": "4.19 kB"
	    },
	    "rule_results": {
	        "avoid_landing_page_redirects": 0,
	        "avoid_plugins": 0,
	        "configure_viewport": 0,
	        "enable_gzip_compression": 0,
	        "leverage_browser_caching": 2.24,
	        "main_resource_server_response_time": 8.09,
	        "minify_css": 0,
	        "minify_html": 0,
	        "minify_javascript": 0,
	        "minimize_render_blocking_resources": 24,
	        "optimize_images": 51.03,
	        "prioritize_visible_content": 0,
	        "size_content_to_viewport": 0,
	        "size_tap_targets_appropriately": 0.04,
	        "use_legible_fontsizes": 0
	    }
	}

 

`site_test_form`

	{
	    "form_id": 1,
	    "error": 0,
	    "published_date": ISODate("2010-09-24"),
	    "screenshot": [
	    	"home/monitor/site-tester/logs/2014-12-21/1419133804754/2_Happy-Online-Offerte-aanvragen/screenshot.png",
	    	"home/monitor/site-tester/logs/2014-12-21/1419133804754/2_Happy-Online-Offerte-aanvragen/screenshot2.png"
	    ],
	    "output": [
	        "Test file: /home/monitor/casperjs-forms/node_test/casper-tests/contactform7.js",
	        "SUITE STARTED  Test suite",
	        "PASS Document can be loaded",
	        "PASS Xpath exists in the DOM",
	        "PASS Xpath references to a form element",
	        "PASS There are visible user input fields found in the form",
	        "PASS WordPress ContactForm7 Casper Plugin is activated",
	        "PASS Find an element matching: *[id=\"wpcf7-f247-o1\"] > form input[type=\"submit\"]",
	        "PASS Ajax response gives a status 200",
	        "PASS Mail is successfully send!",
	        "PASS 8 tests executed in 4.38s, 8 passed, 0 failed, 0 dubious, 0 skipped.",
	        "Result log stored in logs/2014-12-21/1419133143246/1_Happy-Online-Contact-Formulier-Sidebar/xunit.xml"
	    ]
	}


De database kan gemakkelijk worden uitgebreid als er in de toekomst andere site datasources toegevoegd moeten worden, zoals bijvoorbeeld check voor domain validator, o.a. redirects van www naar non-www, bijvoorbeeld:

`site_test_ping`

	{
		"site_id": 1,
		"published_date": ISODate("2010-09-24"),
		"https": 0,
		"www": 0,	
		"message": "",
		"success": 1
		"statusCode": 200,
		"size": 1024,
		"time_first": 40,
		"time_total": 2000,
		"ip": "0.0.0.0"
	}

### Endpoints
Endpoints voor de webserver zijn:

Site information

	/api/site


Site form

	/api/site/form


Site test information

	/api/site/test


Site specific test information

	/api/site/test/?type=xxx


Form type information

	/api/form-type


Notification settings information

	/api/settings/notification


-----

## Sites Tester
De sites tester is een *node process* welke apart van de api draait en de api voorziet van data middels door de webserver vastgestelde endpoints als bijvoorbeeld `/api/sites` met als verb `POST`. 

### Wat wordt er standaard getest
De sites tester dient opgezet te worden waardoor deze makkelijk te extenden is, maar standaard dienen de volgende punten te worden getest:

- Site pagespeed insight via [psi](https://github.com/addyosmani/psi/)
- Site metrics via [phantomas](https://github.com/macbre/phantomas)
- Site ping via [phantomJS](https://github.com/sgentle/phantomjs-node)
- Site forms via custom form test-runner [casperJS](https://www.npmjs.com/package/casperjs)


### Admin configuratie
Er dient een (admin) UI to komen waar site tester configuraties doorgevoerd kunnen worden. Deze configuratie worden ook in api opgeslagen. Configuraties die te beheren zijn:

- Sites toevoegen
- Formulieren types toevoegen
- Formulieren per site toevoegen
- Notificatie instellingen _(deze worden niet opgeslagen in de api)_ 


### Socket Server
Er dient een websocket server op gezet te worden die huidige tests door kan sturen naar clients (stdout) buffer output stream, voor eventuele connecties die status willen tonen.


### Clean up operation
Nadat er een test is gerunned dient er een extra controle te worden uitgevoerd om te kijken of er geen node processen rondzwerven, om te voorkomen dat node processen niet beindigd worden en daardoor de server in problemen kan raken. 
*Let op: het gaat hier om node processen die gespawned worden vanuit de _Site tester_*.

-----

## Visuele schil, de client(s)
Nu er een webserver is die automatisch gevuld wordt met data door de _Site Tester_, kan ieder willekeurige client hier data vanuit ophalen, bewerken, toevoegen of verwijderen. Hoe deze data getoond wordt en op welke device of media is in te vullen aan de developers die werken met de webserver. 

Om eventuele live data (output streambuffer) op te kunnen halen van de tests die momenteel worden uitgevoerd, kan er geconnected worden met de _Site Tester_ middels een socket client die connect met de socket server die draait op de _Site Tester_