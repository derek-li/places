//Requirements:
//Should accept image file
	//Should accept different file formats (jpeg, png, svg, etc)
	//Should accept uploads or image URLs
//Should reverse image search
//Should scan for known country names/locations
//Should return the location on a map
//Should have accounts that can plan and save and share vacation itineraries based on points of interest

//Map initialization.
//Global variables + helper functions
var map;
var geocoder;
var infoWindow;
var asyncQueue = [];

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initMap() { 
	
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.77, lng: -122.41},
		zoom: 7,
		draggableCursor: 'auto;',
		draggingCursor: 'auto;',
		minZoom: 4
	});
	geocoder = new google.maps.Geocoder;
	infoWindow = new google.maps.InfoWindow;
	infoWindow.open(map);
};

function initializeSearchValues() { }

var app = {
	searchObject: {
		resultsArray: undefined,
		locationName: undefined,
		locationDescription: undefined,
		lastSearch: undefined
	},
	travelPlans: [],
	// searchObject: {
	// 	resultsArray: initializeSearchValues,
	// 	locationName: initializeSearchValues,
	// 	locationDescription: initializeSearchValues,
	// 	lastSearch: 
	// }, 
	//Continue with making the search checking function more robust to handle repeat cases and other
	//Answer is most ikely within watchGroup code
	searchLocationByText: function(searchTextInput) {
		geocoder.geocode({
			address: searchTextInput
		}, function(results, status) {
			if (status === 'ZERO_RESULTS') {
				alert('Unable to find location');
			} else if (status === 'ERROR' || status === 'UNKNOWN_ERROR') {
				alert('Error: Request timeout or server issues');
			} else {
				app.searchObject.resultsArray = results;
			}
		});
		//Lines 48- 55 must run ONLY when a change is detected in the searchObject.
		//Otherwise, an exception will be thrown since the geocoder runs asynchronous
	},
	searchByImage: function() {

	},
	getWikiSummary: function(searchTextInput) {
		//Check if the request returns an actual summary
		//Otherwise, do not populate DOM element
		var xhr = new XMLHttpRequest();
		//xml.open('method', 'url', async, 'username', 'password');
		var wikiQuery = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles='
		+ searchTextInput;
		xhr.open('GET',wikiQuery,true);
		xhr.onreadystatechange = function() {
			//readyState has value 0 through 4, 4 representing a 'done' operation 
			//status either returns 0 or 200, basically false and true
			if (xhr.readyState === 4 && xhr.status === 200) {
				//Append data to an unordered list on the DOM
				var wikiResponse;
				var pageId;
				wikiResponse = JSON.parse(xhr.response);
				pageId = Object.keys(wikiResponse.query.pages);
				app.searchObject.locationName = wikiResponse.query.pages[pageId[0]].title;
				app.searchObject.locationDescription = wikiResponse.query.pages[pageId[0]].extract;
				if (app.searchObject.locationDescription.length > 300) {
					app.searchObject.locationDescription = app.searchObject.locationDescription.slice(0,1000) + '...'; 
				}
				app.travelPlans.push({
					title: app.searchObject.locationName,
					id: uuidv4()
				});
			}
		}
		xhr.send(null);
		//Find area on DOM to append information
		//Access title property and summary property via 'response.query.pages.0 index.title'	
	},
	destroyTravelPlans: function(id) {
		for(var i = 0; i < this.travelPlans.length; i++) {
			if (this.travelPlans[i].id === id) {
				this.travelPlans.splice(i,1);
			}
		}
	}
};

var controller = {
	searchByText: function(searchTextInput) {
		var oldValues = Object.values(app.searchObject);
		app.searchLocationByText(searchTextInput);
		app.getWikiSummary(searchTextInput);
		this.checkAsyncStatus(oldValues);
		// var promise = new Promise(function(resolve, reject) {
		// 	var asyncComplete = controller.checkAsyncStatus(oldValues);
		// 	if (asyncComplete === true) {
		// 		resolve();
		// 	}
		// });
		// promise.then(function() {
		// 	view.displayText(app.searchObject.locationName, app.searchObject.locationDescription);
		// 	view.updateMap();
		// 	for (var key in app.searchObject) {
		// 		app.searchObject[key] = undefined;
		// 	}
		// });
	},
	searchByImage: function(imageFileInput) {
		//Must check if file is input
	},
	handleInput: function() {
		var searchTextInput = document.getElementById('searchTextInput');
		var imageFileInput = document.getElementById('imageFileInput');
		if(searchTextInput.value === '' && imageFileInput.value === '') {
			alert('No file or location provided');
		// } else if (imageFileInput.value === '') {
		} else {
			this.searchByText(searchTextInput.value);
			searchTextInput.value = '';
		}
		// } else {
		// 	this.searchByImage(imageFileInput.value);
		// 	imageFileInput.value = '';
		// }
	},
	checkAsyncStatus: function(oldValues) {
		var updateCheck = 0;
		var newValues = Object.values(app.searchObject);
		for (var i = 0; i < 3; i++) {
			if (oldValues[i] !== newValues[i]) {
				updateCheck++;
			}
		}
		if (updateCheck === 3) {
			view.displayText(app.searchObject.locationName, app.searchObject.locationDescription);
			view.updateMap();
			view.displayTravelPlans(app.travelPlans);
			for (var key in app.searchObject) {
				app.searchObject[key] = undefined;
 			}
		} else {
			setTimeout(function() {
				controller.checkAsyncStatus(oldValues);
			}, 0);
		}
	},
	deleteTravelPlan: function(id) {
		app.destroyTravelPlans(id);
		view.displayTravelPlans(app.travelPlans);
	}
};

var view = {
	displayTravelPlans: function(travelPlans) {
		var displayPlansArea = document.getElementById('saved-locations');

		displayPlansArea.innerHTML = '';

		for (var i = 0; i < travelPlans.length; i++) {

            var travelLi = document.createElement('li');
            var travelUl = document.createElement('ul');

            travelLi.textContent = travelPlans[i].title;
            travelLi.id = travelPlans[i].id;

            travelLi.appendChild(this.createDeleteButton());

            displayPlansArea.appendChild(travelLi);
        }

	},
	displayText: function(title, summary) {
		var titleArea = document.getElementById('wiki-title');
		var summaryArea = document.getElementById('wiki-text');
		titleArea.textContent = title;
		summaryArea.innerHTML = summary;
	},
	updateMap: function() {
		var marker = new google.maps.Marker({
			position: app.searchObject.resultsArray[0].geometry.location,
			map: map
		});
		//Populate info with Wiki location summary?
		infoWindow.setContent(app.searchObject.resultsArray[0].formatted_address);
		infoWindow.open(map, marker);
		map.fitBounds(app.searchObject.resultsArray[0].geometry.viewport);
	},
	createDeleteButton: function() {
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'deleteButton';
        return deleteButton;
    },
	setupEventListeners: function() {
		document.getElementById('searchTextInput').addEventListener('keyup', function(event) {
			event.preventDefault();
			if (event.keyCode === 13) {
				controller.handleInput();
			}
		});
		var travelPlansArea = document.getElementById('saved-locations');
        travelPlansArea.addEventListener('click', function(event) {
          var elementClicked = event.target;
          if (elementClicked.className === 'deleteButton') {
            controller.deleteTravelPlan(elementClicked.parentNode.id);
          }
        });
	}
};

view.setupEventListeners();