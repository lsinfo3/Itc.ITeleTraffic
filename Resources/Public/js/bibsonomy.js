/**
*  Bibsonomy.js created by Martin Fischbach and Dennis Wiebusch, modified by ITC
*  @author Martin Fischbach <martin.fischbach@uni-wuerzburg.de>
*  @author Dennis Wiebusch <dennis.wiebusch@uni-wuerzburg.de>
*/

// Searches the DOM tree for elements with id="bib" and
// requests the bibliographies specified by the attribute "bibsonomyUrl" from bibsonomy.org
function initBibsonomy(){
    $("div[bibType='ref-list']").each(function() {
        requestBibsonomyEntries($(this), $(this).attr('bibsonomyUrl'))
    })
    $("input[type='text'][bibType='filter']").keyup(function(e) {
        updateBib($(e.target).attr('bibsonomyUrl'), e.target.value)
    })
    $("input[type='checkbox'][bibType='filter']").change(function(e) {
        updateBib($(e.target).attr('bibsonomyUrl'))
    })    
	var query = parseGetParameters("query");
    if(query != "") {
    	$("input[type='text'][bibType='filter']").val(query);	
    }    
}

function parseGetParameters(val) {
    var result = "",
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    }
    return result;
}


/**
*  Private
*/

//Search in abstracts and bibtex records
var deepSearch = false
//Generated HTML-elements for processed bibsonomy requests
var requests = new Array()
//Parent div elements for bibliographies
var parents = new Array()

var bibtexSpecs = new Object()
bibtexSpecs.allKeys         = new Array("address", "annote", "author", "booktitle", "chapter", "crossref", "edition", "editor", "eprint", "howpublished", "institution", "journal", "key", "month", "note", "number", "organization", "pages", "publisher", "school", "series", "title", "type", "url", "volume", "year" )
bibtexSpecs.article         = new Array("author", "title", "journal", "year", "volume", "number", "pages", "month", "note", "key")
bibtexSpecs.book            = new Array("author", "editor", "title", "publisher", "year", "volume", "number", "series", "address", "edition", "month", "note", "key")
bibtexSpecs.booklet         = new Array("title", "author", "howpublished", "address", "month", "year", "note", "key")
bibtexSpecs.conference      = new Array("author", "title", "booktitle", "year", "editor", "volume", "number", "series", "pages", "address", "month", "organization", "publisher", "note", "key")
bibtexSpecs.inbook          = new Array("author", "editor", "title", "chapter", "pages", "publisher", "year", "volume", "number", "series", "type", "address", "edition", "month", "note", "key")
bibtexSpecs.incollection    = new Array("author", "title", "booktitle", "publisher", "year", "editor", "volume", "number", "series", "type", "chapter", "pages", "address", "edition", "month", "note", "key")
bibtexSpecs.inproceedings   = new Array("author", "title", "booktitle", "year", "editor", "volume", "number", "series", "pages", "address", "month", "organization", "publisher", "note", "key")
bibtexSpecs.manual          = new Array("title", "author", "organization", "address", "edition", "month", "year", "note", "key")
bibtexSpecs.masterthesis    = new Array("author", "title", "school", "year", "type", "address", "month", "note", "key")
bibtexSpecs.misc            = new Array("author", "title", "howpublished", "month", "year", "note", "key")
bibtexSpecs.phdthesis       = new Array("author", "title", "school", "year", "type", "address", "month", "note", "key")
bibtexSpecs.proceedings     = new Array("title", "year", "editor", "volume", "number", "series", "address", "month", "publisher", "organization", "note", "key")
bibtexSpecs.techreport      = new Array("author", "title", "institution", "year", "type", "number", "address", "month", "note", "key")
bibtexSpecs.unpublished     = new Array("author", "title", "note", "month", "year", "key")

/** 
* Retrieves entries from Bibsonomy
* See: http://www.bibsonomy.org/help_en/Integration%20with%20other%20websites
*/
function requestBibsonomyEntries(parent, bibsonomyUrl) {
    //Enable loading animation
    parent.height('100px');
    parent.activity();
 
    $.ajax({
        url: '/_Resources/Static/Packages/Itc.ITeleTraffic/js/bibsonomy.php',
        dataType: "json",
        data: { bibUri: bibsonomyUrl},
        success: handleJsonBibsonomyRequest.partial(bibsonomyUrl, parent, undefined)
    });
}


function updateBib(bibsonomyUrl, fText) {
    if(parents[bibsonomyUrl]){

        var filtered = requests[bibsonomyUrl]
        $("input[type='checkbox'][bibType='filter']").each(function() {
            if($(this).attr('bibsonomyUrl') == bibsonomyUrl) {
                if($(this).prop('checked')){
                   if($(this).attr('filter'))
                        filtered = filter(filtered, $(this).attr('filter'))
                    if($(this).attr('filterTag'))
                        filtered = filterTag(filtered, $(this).attr('filterTag'))
                }
            }
        })

        if(fText)
            filtered = filter(filtered, fText);

        updateInfo(bibsonomyUrl, filtered.length)
        insertBibsonomyElementsBelow(filtered, parents[bibsonomyUrl].empty());
    }
}

function bibsonomyPathToId(path) {
	return path.toString().replace(/\//g, '-'); 
}

function updateInfo(bibsonomyUrl, nrOfSelectedEntries){
    $("[bibType='info']").each(function() {
        if($(this).attr('bibsonomyUrl') == bibsonomyUrl) {
            if((typeof nrOfSelectedEntries != 'undefined') && (nrOfSelectedEntries < requests[bibsonomyUrl].length))
                $(this).html(nrOfSelectedEntries + " / " + requests[bibsonomyUrl].length + " entries")
            else
                $(this).html(requests[bibsonomyUrl].length + " entries")
        }
    });
}

//Processed JSON Bibsonomy request by creating HTML-elements and by inserting them into the document
function handleJsonBibsonomyRequest(bibsonomyUrl, parent, feed) {
	parents[bibsonomyUrl] = parent
	var elements = processJsonBibsonomyFeed(feed)
	if(parent.attr('filter'))
	    elements = filter(elements, parent.attr('filter'))
	if(parent.attr('filterTag'))
	    elements = filterTag(elements, parent.attr('filterTag'))
	requests[bibsonomyUrl] = elements;
	var query = parseGetParameters("query");
    if(query != "") {
    	updateBib(bibsonomyUrl,query);
    } else {
    	updateBib(bibsonomyUrl);
    }
}

function insertBibsonomyElementsBelow(elements, parent) {
    //Disable loading animation
    parent.activity(false);
    parent.height('');

    var year = 0
    for(var i = 0; i < elements.length; i++){
        if(year != elements[i].year) {
            year = elements[i].year
            var heading = document.createElement("H3");
            heading.innerHTML    = year
            heading.className    = "bib-year"
            parent.get(0).appendChild(heading);
        }
        parent.get(0).appendChild(elements[i].div_element);
    }
}

//Processed a requested JSON Bibsonomy feed and creates HTML-elements for every entry
function processJsonBibsonomyFeed(feed) {
    var result = feed.items.sort(comparator);
    var elements = new Array()
    for(var i = 0; i < result.length; i++){
        result[i].bibtex = parseBibtexJSON(result[i])
        result[i].div_element = createDivElementFromBibsonomyItem(result[i])
    }
    return result;
}

//Creates a HTML-element from a bibsonomy feed item
//http://www.apastyle.org/learn/tutorials/basics-tutorial.aspx
function createDivElementFromBibsonomyItem(item){
    var itemId              = generateLocalId(item.id);
    var item_div            = document.createElement("DIV");
    item_div.className      = "item"

    if(item.type == "Bookmark") {
        var title           = document.createElement("SPAN");
        title.innerHTML     = " " + item.label
        title.className     = "pubtitle"
        item_div.appendChild(title);

        var url             = document.createElement("SPAN");
        url.innerHTML       = item.url
        url.className       = "puburl"
        item_div.appendChild(document.createTextNode(", "));
        item_div.appendChild(url);

        var date            = document.createElement("SPAN");
        date.innerHTML      = item.date.split(" ")[0]
        date.className      = "pubdate"
        item_div.appendChild(document.createTextNode(", "));
        item_div.appendChild(date);
    }
    else {
        if (item.editors){
            var editors         = document.createElement("SPAN");
            editors.innerHTML   = editors2txt(item.editors)
            editors.className   = "pubeditors"
        }

        if (item.authors){
            var authors         = document.createElement("SPAN");
            authors.innerHTML   = authors2txt(item.authors) 
            authors.className   = "pubauthors"
        }

        if (authors){
            item_div.appendChild(authors)
			item_div.appendChild(document.createElement("BR"));
        }else if (editors)
            item_div.appendChild(editors)

		// if (item.title){
//         	var title               = document.createElement("SPAN");
//         	title.innerHTML         = " " + item.label
//         	title.className         = "pubtitle"
//         	item_div.appendChild(document.createTextNode(", "));
//         	item_div.appendChild(title);
// 		}
		
		if (item.label){
        	var title               = document.createElement("SPAN");
        	title.innerHTML         = item.label
        	title.className         = "pubtitle"
        	item_div.appendChild(title);
		item_div.appendChild(document.createElement("BR"))
		}
		
        if (item.booktitle){
            var booktitle       = document.createElement("SPAN");
            booktitle.innerHTML = item.booktitle
            booktitle.className = "pubbooktitle"
            //item_div.appendChild(document.createTextNode(", In "))
            item_div.appendChild(document.createTextNode("In "))
        }
		
        if (item.journal){
            var journal       = document.createElement("SPAN");
            journal.innerHTML = item.journal
            journal.className = "pubjournal"
            item_div.appendChild(document.createTextNode(", In "))
        }
			
        if(authors && editors)
            item_div.appendChild(editors)

        if (booktitle)
            item_div.appendChild(booktitle);

	    if (journal)
	        item_div.appendChild(journal);


        if (item.volume){
            var volume       = document.createElement("SPAN");
            volume.innerHTML = item.volume
            volume.className = "pubvolume"
            item_div.appendChild(document.createTextNode(", Vol. "))
            item_div.appendChild(volume);   
		}
        if (item.number){
            var number       = document.createElement("SPAN");
            number.innerHTML = item.number
            number.className = "pubnumber"
            item_div.appendChild(document.createTextNode(" ("))
			item_div.appendChild(number);
            item_div.appendChild(document.createTextNode(")"))
        }
			
        if(item.pages) {
            var pages               = document.createElement("SPAN");
            pages.innerHTML         = pages2txt(item.pages)
            pages.className         = ", " + "pubpages"
            item_div.appendChild(pages);
        }

        item_div.appendChild(document.createTextNode(". "))

        if(item.address) {
            var address              = document.createElement("SPAN");
            address.innerHTML         = item.address
            address.className         = "pubaddress"
            item_div.appendChild(address);
        }

        if(item.publisher) {
            if(item.address)
                item_div.appendChild(document.createTextNode(": "))

            var publisher           = document.createElement("SPAN");
            publisher.innerHTML         = item.publisher
            publisher.className         = "pubpublisher"
            item_div.appendChild(publisher);
        }

        if(item.year) {
            var year            = document.createElement("SPAN");
            if(item.publisher) 
				year.innerHTML      = ", "
			year.innerHTML      =  year.innerHTML + item.year + "."
            year.className      = "year"
            item_div.appendChild(year);
        }
		
        if(item.note) {
            var note            = document.createElement("SPAN");
            note.innerHTML      = " " + item.note 
            note.className      = "note"
            item_div.appendChild(note);
        }

    }

    return appendLinks(item_div, item, itemId);
}

function appendLinks(item_div, item, itemId) {
    item_div.appendChild(document.createElement("BR"))

    var bibtex                  = document.createElement("A");
    bibtex.className            = "bibtexLink"
    bibtex.innerHTML            = "[BibTeX]";
    bibtex.href                 = "javascript:showBibtex('" + itemId + "')"
    bibtex.id                   = "bibtex_" + itemId
    item_div.appendChild(bibtex);

    if (item.abstract) {
        var abstract            = document.createElement("A");
        abstract.className      = "abstractLink"
        abstract.innerHTML      = "[Abstract]"
        abstract.href           = "javascript:showAbstract('"+ itemId + "')"
        abstract.id             = "abstract_" + itemId
        item_div.appendChild(abstract);
    }

    if (item.url){
        var file                = document.createElement("A");
        var isAcmAuthorizorLink = item.url.toLowerCase().indexOf("dl.acm.org/authorize") >= 0;
        file.href               = item.url
        file.className          = "fileLink"
        file.innerHTML          = "[Download]"
        //http://dl.acm.org/authorize?N93641
        if(isAcmAuthorizorLink) {
            //Not on main publication page
        }
        
        item_div.appendChild(file);
    }

    var bibsonomy               = document.createElement("A");
    bibsonomy.href              = item.id
    bibsonomy.className         = "bibsonomyLink"
    bibsonomy.innerHTML         = "[BibSonomy]"
    item_div.appendChild(bibsonomy)

    var bibtex_txt              = document.createElement("DIV")
    bibtex_txt.id               = "bibtexDIV_" + itemId
    bibtex_txt.style.display    = "none"
    bibtex_txt.className        = "bibtex";
    bibtex_txt.innerHTML        = item.bibtex;
    item_div.appendChild(bibtex_txt)

    if (item.abstract) {
        var abstract_txt        = document.createElement("DIV");
        abstract_txt.id         = "abstractDIV_" + itemId
        abstract_txt.style.display = "none"
        abstract_txt.innerHTML  = "<strong>Abstract:</strong> " + item.abstract
        abstract_txt.className  = "abstract"
        item_div.appendChild(abstract_txt)
    }
    return item_div;
}

function showAbstract(itemId){
    document.getElementById("abstractDIV_" + itemId).style.display = "block";
    document.getElementById("abstract_" + itemId).href = "javascript:hideAbstract('"+ itemId + "')"
}

function hideAbstract(itemId){
    document.getElementById("abstractDIV_" + itemId).style.display = "none";
    document.getElementById("abstract_" + itemId).href = "javascript:showAbstract('"+ itemId + "')"
}

function showBibtex(itemId){
    document.getElementById("bibtexDIV_" + itemId).style.display = "block";
    document.getElementById("bibtex_" + itemId).href = "javascript:hideBibtex('"+ itemId + "')"
}

function hideBibtex(itemId){
    document.getElementById("bibtexDIV_" + itemId).style.display = "none";
    document.getElementById("bibtex_" + itemId).href = "javascript:showBibtex('"+ itemId + "')"
}

function parseBibtexJSON(item){
    var pubtype = item['pub-type']
    var fields = bibtexSpecs[pubtype]
    var retString = "@" + pubtype + "{" + item.bibtexKey + ",\n  title" + makeTabs("title") +" = {" + item.label + "}"
    for (var i in fields){
        var key = fields[i]
        if (item[key]){
            retString += ",\n  "+ key + makeTabs(key)
            if (key != "author")
                retString += " = {" + item[key] + "}" 
            else {
                retString += " = {" + item.authors[0].last + ", " + item.authors[0].first 
                for (var author = 1; author < item.authors.length; author++ )
                    retString += " and " + item.authors[author].last + ", " + item.authors[author].first  
                retString += "}" 
            }
        }
    }
    return retString + "\n}"
}

function filterTag(elements, fTag){
    if(fTag == "") return elements;
    var _res = new Array();
    for (var i=0; i<elements.length; i++){
        if (_filterTag(elements[i], fTag)) _res.push(elements[i])
    }
    return _res;
}

function filter(elements, fText){
    if(fText == "") return elements;
    var _res = new Array();
    for (var i=0; i<elements.length; i++){
        if (_filter(elements[i], fText)) _res.push(elements[i])
    }
    return _res;
}

function ciFilter(elem, text){
    return elem.toLowerCase().indexOf(text.toLowerCase()) != -1
}

function _filter(item, fText){
    return  (item.label && ciFilter(item.label, fText)) ||
            (item.authors && ciFilter(authors2txt(item.authors), fText)) ||
            (item.editors && ciFilter(editors2txt(item.editors), fText)) ||
            (item.booktitle && ciFilter(item.booktitle, fText)) ||
            (item.journal && ciFilter(item.journal, fText)) ||
            (item.publisher && ciFilter(item.publisher, fText)) ||
            (item.year && ciFilter(item.year, fText)) ||
            (deepSearch && item.abstract && ciFilter(item.abstract, fText))||
            (deepSearch && item.bibtex && ciFilter(item.bibtex, fText))
}

function _filterTag(item, fTag){
    if(item.tags)
        return $.inArray(fTag, item.tags) != -1
    else
        return false
}

function makeTabs(key){
    var maxLength = 0
    for (var i in bibtexSpecs.allKeys)
        maxLength = bibtexSpecs.allKeys[i].length > maxLength ? bibtexSpecs.allKeys[i].length : maxLength 
    var retVal = ""
    for (var i =0; i<maxLength - key.length; i++)
        retVal += " "
    return retVal
}

function authors2txt(authors){
    if (!authors)
        return "";
/*    var retVal = " " + authors[0].last + ", " + authors[0].first*/
    var retVal = " " + authors[0].first + " " + authors[0].last
    for (var i=1; i<authors.length; i++) {
    	retVal += ", " + authors[i].first + " " + authors[i].last
       /* retVal += ", " + authors[i].last + ", " + authors[i].first*/
    }
    return retVal
}

function editors2txt(editors){
    if (!editors)
        return ""
/*    var retVal = " " + editors[0].last + ", " + editors[0].first*/
    var retVal = " " + editors[0].first + " " + editors[0].last
    for (var i=1; i<editors.length; i++) {
/*        retVal += ", " + editors[i].last + ", " + editors[i].first*/
        retVal += ", " + editors[i].first + " " + editors[i].last
    }
    return retVal + (editors.length == 1 ? " (Ed.), " : " (Eds.), ")
}

function pages2txt(pages) {
    if(ciFilter(pages,"-"))
        return "pp. " + pages.replace("--","-").replace(/ /g, "")
    else
        return "p. " + pages
}

/**
* comparator function for array sort
**/
function comparator(x,y) {
    if (x.year && y.year)
        if (x.year.toLowerCase() != y.year.toLowerCase())
            return (x.year.toLowerCase() > y.year.toLowerCase()) ? -1 : 1                  
    if (x.label && y.label)
        return (x.label.toLowerCase() < y.label.toLowerCase()) ? -1 : 1
    return 0
}

/**
* sorts array to frequency
**/
function softFreq(x,y) {
    return y.count - x.count; 
}

//From: http://ejohn.org/blog/partial-functions-in-javascript/
//Currying support for functions
Function.prototype.partial = function(){
    var fn = this, args = Array.prototype.slice.call(arguments);
    return function(){
      var arg = 0;
      for ( var i = 0; i < args.length && arg < arguments.length; i++ )
        if ( args[i] === undefined )
          args[i] = arguments[arg++];
      return fn.apply(this, args);
    };
  };

function generateLocalId(bibsonomyId){
	return bibsonomyPathToId(bibsonomyId.toString().replace(/http:\/\/www\.bibsonomy\.org\/*/, "")) + "-" + Math.random().toString().replace("0.","");
}
