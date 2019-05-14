$(document).ready(function () {

    var BranchDataModels = [];

    //define branch model
    var BranchModel = Backbone.Model.extend({
        defaults: {
            photo: "/img/placeholder.png"
        }
    });

    //define branch collection
    var BranchCol = Backbone.Collection.extend({
        model: BranchModel
    });

    //define infowindow view
    var BranchInfoWindowView = Backbone.View.extend({
        tagName: "div",
        className: "infowindow",
        template: $("#infoWindowTemplate").html(),

        render: function () {
            var tmpl = _.template(this.template);
            $(this.el).html(tmpl(this.model));
            return this;
        }
    });


    //define listing view
    var BranchListView = Backbone.View.extend({
        tagName: "div",
        className: "nearby_list",
        template: $("#listTemplate").html(),

        render: function () {
            var tmpl = _.template(this.template);
            $(this.el).html(tmpl(this.model));
            return this;
        }
    });

    //define master view
    var MasterView = Backbone.View.extend({
        el: $(".pnl_locator"),

        events: {
            "change .radio_list input[type='radio']": "setFilter",
            "click .lnk_branch": "handleBranchClick",
            "click .lnk_go": "handlePlaceByButton",
            "keydown .txt_loc_search": "handlePlaceByEnter",
            "click .start_over": "handleRestart"
        },

        //init google map library and collection
        initialize: function () {
            this.filterType = null;

            if (this.filterType === null) {
                //outside container
                //$("#p_lt_ctl00_BranchLocator_rdl_list_0").prop("checked", true);
                //inside web part container
                $("#p_lt_ctl02_wP_p_lt_ctl01_WebPartCustomContainer_ctl00_rdl_list_0").prop("checked", true);
            }

            var ft = $("input:radio[name='p$lt$ctl02$wP$p$lt$ctl01$WebPartCustomContainer$ctl00$rdl_list']:checked", '.radio_list').val();

            if (typeof ft !== "undefined") {
                this.filterType = ft;
            }

            this.searchInput = null;
            this.cnState = null;
            this.markersArray = [];
            this.labelsArray = [];
            this.distanceArray = [];
            this.defaultCoord = { c_x: 109.379883, c_y: 3.951941 }; //y,x capital square HQ
            //this.defaultCoord = { c_x: 101.708002, c_y: 3.151426 };
            this.MAX_DISPLAY_ITEMS = 50;

            this.loadMap();
        },

        loadMap: function () {
            var myOptions = {
                zoom: 5, //17,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
            this.initLayouts();
            this.initLocation();

            this.getBranches();
        },

        initLocation: function () {
            map.setCenter(new google.maps.LatLng(this.defaultCoord.c_y, this.defaultCoord.c_x));
            //Try W3C Geolocation (Preferred)
            if (navigator.geolocation) {
                browserSupportFlag = true;
                navigator.geolocation.getCurrentPosition(function (position) {
                    map.setZoom(17);
                    map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                }, function () {
                    this.handleNoGeolocation(browserSupportFlag);
                });
                //Try Google Gears Geolocation
            } else if (google.gears) {
                browserSupportFlag = true;
                var geo = google.gears.factory.create('beta.geolocation');
                geo.getCurrentPosition(function (position) {
                    map.setZoom(17);
                    map.setCenter(new google.maps.LatLng(position.latitude, position.longitude));
                }, function () {
                    this.handleNoGeoLocation(browserSupportFlag);
                });
                //Browser doesn't support Geolocation
            } else {
                browserSupportFlag = false;
                this.handleNoGeolocation(browserSupportFlag);
            }
        },

        handleNoGeolocation: function (errorFlag) {
            if (errorFlag == true) {
                alert("Geolocation service failed.");
            } else {
                alert("Your browser doesn't support geolocation. ");
            }
            map.setZoom(5);
            map.setCenter(new google.maps.LatLng(this.defaultCoord.c_y, this.defaultCoord.c_x));
        },

        initLayouts: function () {
            infowindow = new google.maps.InfoWindow();
            geocoder = new google.maps.Geocoder();
            this.initLabel();
            this.initAutoComplete();
        },

        initLabel: function () {
            Label.prototype = new google.maps.OverlayView;

            Label.prototype.onAdd = function () {
                var pane = this.getPanes().overlayImage;
                pane.appendChild(this.div_);

                // Ensures the label is redrawn if the text or position is changed.
                var me = this;
                this.listeners_ = [
					google.maps.event.addListener(this, 'position_changed', function () { me.draw(); }),
					google.maps.event.addListener(this, 'visible_changed', function () { me.draw(); }),
					google.maps.event.addListener(this, 'clickable_changed', function () { me.draw(); }),
					google.maps.event.addListener(this, 'text_changed', function () { me.draw(); }),
					google.maps.event.addListener(this, 'zindex_changed', function () { me.draw(); }),
					google.maps.event.addDomListener(this.div_, 'click', function () {
					    if (me.get('clickable')) {
					        google.maps.event.trigger(me, 'click');
					    }
					})
				];
            };

            Label.prototype.onRemove = function () {
                this.div_.parentNode.removeChild(this.div_);
                // Label is removed from the map, stop updating its position/text.
                for (var i = 0, I = this.listeners_.length; i < I; ++i) {
                    google.maps.event.removeListener(this.listeners_[i]);
                }
            };

            Label.prototype.draw = function () {
                var projection = this.getProjection();
                var position = projection.fromLatLngToDivPixel(this.get('position'));

                var div = this.div_;
                div.style.left = (position.x - 9) + 'px';
                div.style.top = (position.y - 35) + 'px';
                var visible = this.get('visible');
                div.style.display = visible ? 'block' : 'none';

                var clickable = this.get('clickable');
                this.span_.style.cursor = clickable ? 'pointer' : '';

                var zIndex = this.get('zIndex');

                this.span_.innerHTML = this.get('text').toString();
            };
        },

        initCollection: function () {

            this.collection = new BranchCol(BranchDataModels);
            var filterType = this.filterType;
            var filtered = _.filter(this.collection.models, function (item) {
                // return item.get("type").indexOf(filterType) != -1;
                return item.get("typename").indexOf(filterType) != -1;
            });
            this.collection.reset(filtered, { silent: true });

            this.render();
            this.on("change:filterType", this.filterByType, this);
            this.on("change:filterLocation", this.filterByLocation, this);
            this.on("change:filterState", this.filterByState, this);
            this.collection.on("reset", this.render, this);
        },

        getBranches: function () {
            //check the link
            var me = this;
            $.ajax({
                type: "POST",
                url: '/CMSModules/BranchLocator/Locate/Locating.asmx/GetBranches',

                data: "{}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    //alert("hi");
                    if (res) {
                        BranchDataModels = jQuery.parseJSON(res.d);
                        if (me.filterType != null) {

                            //inside container
                            var $radios = $("input:radio[name='p$lt$ctl02$wP$p$lt$ctl01$WebPartCustomContainer$ctl00$rdl_list']");

                            $radios.filter("[value='" + me.filterType.toUpperCase() + "']").prop('checked', true);

                        }
                        me.initCollection();
                    }
                }, error: function () {
                    //alert("Query not found");
                }
            });
        },

        //Change normal address to 
        getLatLng: function (addr) {

            if (geocoder == null) {
                geocoder = new google.maps.Geocoder();
            }
            var me = this;
            geocoder.geocode({
                'address': addr,
                'region': 'MY'
            }, function (results, status) {

                if (status == google.maps.GeocoderStatus.OK) {
                    var location = results[0].geometry.location;

                    map.setCenter(location);
                    map.setZoom(15);
                    me.searchInput = location;
                    me.trigger("change:filterLocation");
                } else {
                    alert("Sorry, we couldn't find the location '" + addr + "'. \nPlease check the spelling or try zooming into the relevant area on the map.");
                }

            });
        },


        getIcon: function (type, urlOnly) {
            //the selection value
            var r_type = this.filterType;
            var types = [];
            var icons = [];
            _.each(this.collection.models, function (item) {
                types.push(item.get("typename"));
                icons.push(item.get("icon"));
            }, this);

            for (var n = 0; n < types.length; n++) {
                var case_type = types[n];
                switch (case_type) {
                    case case_type:
                        if (case_type == r_type) {
                            icon = "<img title='" + case_type + "' src='/AFFINBANK/media/images/icon/" + icons[n] + "' alt='" + case_type + "'>"; imageUrl = '/AFFINBANK/media/images/icon/' + icons[n];

                            break;
                        }
                }
            };

            if (urlOnly) {
                return imageUrl;
            }

            return icon;
        },

        //try show icon with type name
        showIcon: function (type, urlOnly) {

            if (type != null && type != '') {
                var type = type;
            }
            var types = [];
            var icons = [];
            _.each(this.collection.models, function (item) {
                types.push(item.get("typename"));
                icons.push(item.get("icon"));
            }, this);

            for (var n = 0; n < types.length; n++) {
                var case_type = types[n];
                switch (case_type) {
                    case case_type:
                        if (case_type == type) {
                            icon = "<img title='" + case_type + "' src='/AFFINBANK/media/images/icon/" + icons[n] + "' alt='" + case_type + "'>"; imageUrl = '/AFFINBANK/media/images/icon/' + icons[n];

                            break;
                        }
                }
            };

            var icon, imageUrl;

            if (urlOnly) {

                return imageUrl;
            }
            return icon;
        },


        render: function () {

            this.deleteOverlays();
            this.renderMarker();
            if (this.searchInput != null && this.searchInput != '') {
                this.renderLabel();
                this.renderList();
            }
        },

        renderMarker: function () {
            this.markersArray.length = 0;
            var filter = this.filterType;
            _.each(this.collection.models, function (item) {
                var typename = item.get("typename");
                if (typename === filter) {
                    var point = item.get("point");
                    var name = item.get("name");
                    if (point == null) {
                        point = new google.maps.LatLng(item.get("c_y"), item.get("c_x"));
                        item.set("point", point);
                    }
                    var name = item.get("name").replace(/<[^<]*br[^>]*>/gi, ' ');

                    var db_marker = new google.maps.Marker({
                        position: point,
                        map: map,
                        icon: this.getIcon(null, true),
                        title: name
                    });

                    //when the address pop up
                    google.maps.event.addListener(db_marker, 'click', function () {

                        window.app.view.renderInfoWindow(item, db_marker);

                    });

                    this.markersArray.push(db_marker);
                }
            }, this);
        },

        renderLabel: function () {
            if (this.markersArray.length > 0) {
                this.labelsArray.length = 0;
                var filter = this.filterType;
                var title = [];
                var current_marker = [];

                _.each(this.collection.models, function (item, i) {
                    var name = item.get("name");

                    var typename = item.get("typename");
                    if (typename == filter) {
                        var point = item.get("point");
                        var found = false;

                        for (var n = 0; n < this.markersArray.length; n++) {
                            var markerNow = this.markersArray[n];

                            if (!found && markerNow.getPosition().equals(point)) {

                                current_marker.push(markerNow.title);

                                for (var j = 0; j < current_marker.length; j++) {
                                    var num = j + 1;

                                    var label = new Label({ //put numbering
                                        map: map
                                    }, markerNow);

                                    label.set('text', "<div class='marker_label'>" + num + "</div>");
                                    label.bindTo('position', markerNow);
                                    label.bindTo('visible', markerNow);
                                    label.bindTo('clickable', markerNow);
                                    label.bindTo('zIndex', markerNow);
                                    var me = this;
                                    google.maps.event.addListener(label, 'click', function () {
                                        window.app.view.renderInfoWindow(item, label.markerNow);

                                    });
                                    this.labelsArray.push(label);
                                    found = true;
                                }
                            }
                        }
                    }
                }, this);
            }
        },

        renderInfoWindow: function (item, marker) {

            map.setCenter(item.get("point"));
            map.setZoom(15);

            var iconImgArray = [];
            var itemTypes = item.get("type").split(";");
            var icon_img = [];

            _.each(itemTypes, function (type) {
                if (type != '') {
                    var img = this.showIcon(type, false);
                    iconImgArray.push(img);
                }
            }, this);

            var infoWindowView = new BranchInfoWindowView({
                model: {
                    name: item.get("name"),
                    icons: iconImgArray,
                    detail: item.get("detail").unescapeHtml(),
                    site: item.get("site"),
                    branch: item.get("branch")
                }
            });
            var information = infoWindowView.render().el;
            infowindow.close();
            infowindow.setContent(information);
            infowindow.open(map, marker);
            if (item.get("branch") != '') {
                var info = '<h2>' + item.get("name") + '</h2><div>' + item.get("detail").unescapeHtml() + '<br/>' + '<p>Managing Branch:' + item.get("branch") + '</p></div>';
            }
            else {
                var info = '<h2>' + item.get("name") + '</h2><div>' + item.get("detail").unescapeHtml() + '</div>';
            }
            $('#px_help').hide();
            $('#px_branch').hide().html(info).fadeIn(500);
        },

        renderList: function () {
            var branches = [];
            var b = [];
            var type = this.filterType;
            var name = [];
            _.each(this.collection.models, function (item) {
                branches.push(item.toJSON());
            }, this);

            for (var i = 0; i < branches.length; i++) {
                if (branches[i].typename == type) {
                    b.push(branches[i]);
                }
            }
            //console.log(b.length);
            var location = $('.loc_search_container .txt_loc_search').val().trim();
            var listView = new BranchListView({
                model: {
                    branches: b,
                    search_input: location
                }
            });

            $('.loc_results_list').html(listView.render().el).fadeIn(300);
        },

        initAutoComplete: function () {
            //search autocomplete
            var input = $('.loc_search_container .txt_loc_search').get(0);
            autocomplete = new google.maps.places.Autocomplete(input);
            autocomplete.bindTo('bounds', map);
            autocomplete.setTypes([]); /* [] or ['establishment'] or ['geocode'] */
            var me = this;
            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                me.handlePlaceChange();
            });
            //google.maps.event.addListener(autocomplete, 'place_changed', handlePlaceChange);
        },

        handlePlaceChange: function () {
            this.resetDisplay();
            var place = autocomplete.getPlace();
            if (place.geometry != null) {
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);

                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(15);
                }
                this.searchInput = place.geometry.location;

                this.trigger("change:filterLocation");
            }
        },

        handlePlaceByButton: function () {
            var input = $('.loc_search_container .txt_loc_search').val().trim();
            if (input != '') {
                this.getLatLng(input);
            }
        },

        handlePlaceByEnter: function (e) {
            var key = e.charCode || e.keyCode || 0;
            if (key == 13) {
                var input = e.currentTarget.value.trim();
                if (input != '') {
                    this.getLatLng(input);
                }
                return false;
            }
        },

        handleRestart: function () {
            this.resetDisplay();
            $('.loc_search_container .txt_loc_search').val('')

            var $radios = $("input:radio[name='p$lt$ctl02$wP$p$lt$ctl01$WebPartCustomContainer$ctl00$rdl_list']");

            $radios.filter("[value='" + this.filterType.toUpperCase() + "']").prop('checked', true);

            this.initialize();
            this.buildUrl();
        },

        handleBranchClick: function (e) {
            var id = e.currentTarget.id;
            var clickedMarker = this.markersArray[id];
            google.maps.event.trigger(clickedMarker, 'click');
        },

        resetDisplay: function () {
            this.deleteOverlays();
            $('#px_branch').fadeOut(500);
            $('.pnl_locator .loc_results_list').fadeOut(500);
            if (!$('#px_help').is(":visible")) {
                $('#px_help').fadeIn(300);
            }
        },

        deleteOverlays: function () {
            if (infowindow != null) {
                infowindow.close();
            }
            if (this.markersArray) {
                for (i in this.markersArray) {
                    this.markersArray[i].setMap(null);
                }
                this.markersArray.length = 0;
            }
            if (this.labelsArray) {
                for (i in this.labelsArray) {
                    this.labelsArray[i].setMap(null);
                }
                this.labelsArray.length = 0;
            }
        },

        calcDistances: function (ori, destArr) {
            var destination = destArr;
            var me = this;
            var service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: ori, //[origin1, origin2],
                destinations: destination, //destArray, //[destinationA, destinationB],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, function (response, status) {
                me.distanceCallBack(response, status);
            });
        },

        distanceCallBack: function (response, status) {

            if (status == google.maps.DistanceMatrixStatus.OK) {
                var results = response.rows[0].elements;
                for (var j = 0; j < results.length; j++) {
                    //console.log(j);
                    var distance = results[j].distance.text;
                    this.distanceArray.push(distance);
                }

                // console.log('distance' + this.distanceArray.length);
                // console.log('collect' + this.collection.length);

                // console.log(this.collection);

                //check whether have all distance from callback
                if (this.distanceArray.length == this.collection.length) {

                    //console.log('distance Final' + this.distanceArray.length);
                    //console.log('collect Final' + this.collection.length);

                    //if (this.distanceArray.length != 0) {
                    _.each(this.collection.models, function (item, i) {
                        item.set("distance", this.distanceArray[i]);

                        //console.log(item.attributes.distance);

                    }, this);
                    this.distanceArray.length = 0;

                    //sort by distance
                    var sorted = this.collection.toArray().sort(function (a, b) {
                        return parseFloat(a.get('distance')) - parseFloat(b.get('distance'));
                    });

                    sorted = _.first(sorted, this.MAX_DISPLAY_ITEMS);

                    this.collection.reset(sorted);
                    this.buildUrl();
                }
            } else {
                this.distanceArray.length = 0;
                //alert('Geocode was not successful due to: ' + status);
            }
        },

        setFilter: function (e) {
            this.filterType = e.currentTarget.value;
            this.trigger("change:filterType");
        },

        filterByType: function () {
            if (this.filterType != null && this.filterType != '') {

                this.collection.reset(BranchDataModels, { silent: true }); //reset to all data 1st without trigger reset event
                var filterType = this.filterType;
                var filtered = _.filter(this.collection.models, function (item) {

                    //return item.get("type").indexOf(filterType) != -1;
                    return item.get("typename").indexOf(filterType) != -1;
                });

                var $radios = $("input:radio[name='p$lt$ctl02$wP$p$lt$ctl01$WebPartCustomContainer$ctl00$rdl_list']");

                $radios.filter("[value='" + this.filterType.toUpperCase() + "']").prop('checked', true);

                if (this.searchInput != null && this.searchInput != '') {
                    this.collection.reset(filtered, { silent: true });
                    this.trigger("change:filterLocation");

                } else if (this.cnState != null && this.cnState != '') {
                    this.collection.reset(filtered, { silent: true });
                    this.trigger("change:filterState");

                } else {
                    this.collection.reset(filtered);
                }
                this.buildUrl();
            }
        },

        filterByLocation: function () {
            if (this.searchInput != null && this.searchInput != '') {
                var location = this.searchInput;

                var radius = new google.maps.Circle({
                    center: location,
                    radius: 12000,
                    // radius: 6500,
                    //radius: 10000,
                    //radius: 8000,
                    //radius: 5000, //12000 upto 22.5km //20000,	//in meter //radius for display
                    fillOpacity: 0,
                    strokeOpacity: 0,
                    map: map
                });
                var filtered = _.filter(this.collection.models, function (item) {

                    var point = item.get("point");

                    if (point == null) {
                        var c_y = item.get("c_y");
                        var c_x = item.get("c_x");
                        point = new google.maps.LatLng(c_y, c_x);
                        item.set("point", point);
                    }

                    return radius.getBounds().contains(point);
                });

                //console.log(filtered.length);

                if (filtered.length > 0) {

                    //console.log(filtered.length);

                    this.collection.reset(filtered, { silent: true }); //suppress reset event

                    //Note: max 25 destination per request by google map
                    var origin = [];
                    origin[0] = location;
                    var dest = [];
                    var temp = [];
                    this.distanceArray.length = 0;
                    var m = 1;
                    _.each(filtered, function (item, i) {
                        temp.push(item.get("point"));

                        if ((i % 20 && i > 0) || (i == this.collection.length - 1)) {
                            dest = temp;

                            //console.log(i);
                            //console.log(origin.length);
                            //console.log(dest);

                            this.calcDistances(origin, dest);
                            temp = [];
                        }

                    }, this);

                } else {
                    this.collection.reset(filtered); //reset and render
                }
            }
        },

        filterByState: function () {
            if (this.cnState != null && this.cnState != '') {

            }
        },

        buildUrl: function () {

            var fragment = '';
            if (this.filterType != null && this.filterType != '') {
                fragment += "filter/" + this.filterType;
            }
            if (this.searchInput != null && this.searchInput != '') {
                if (fragment.length > 0) fragment += "/";
                fragment += "search/" + this.searchInput;
            }
            else if (this.cnState != null && this.cnState != '') {
                if (fragment.length > 0) fragment += "/";
                fragment += "state/" + this.cnState;
            }
            window.app.router.navigate(fragment);
        }
    });

    //add routing
    var MapRouter = Backbone.Router.extend({
        routes: {
            "filter/:type": "urlFilter",
            "filter/:type/": "urlFilter",
            "search/:location": "urlFilter",
            "search/:location/": "urlFilter",
            "state/:state": "urlFilter",
            "state/:state/": "urlFilter",
            "filter/:type/search/:location": "urlFilter",
            "filter/:type/search/:location/": "urlFilter",
            "filter/:type/state/:state": "urlFilter",
            "filter/:type/state/:state/": "urlFilter"
        },

        urlFilter: function (type, location, state) {

            window.app.view.filterType = type.toUpperCase();
            window.app.view.searchInput = location;
            window.app.view.cnState = state;
            window.app.view.trigger("change:filterType");
        }
    });

    //label prototype
    var Label = function (opt_options, marker) {
        this.setValues(opt_options);
        this.marker = marker;
        var span = this.span_ = document.createElement('div');
        var div = this.div_ = document.createElement('div');
        div.appendChild(span);
        div.style.cssText = 'position: absolute; display: none';
    }

    //string un-escape html 
    String.prototype.unescapeHtml = function () {
        var temp = document.createElement("div");
        temp.innerHTML = this;
        var result = temp.childNodes[0].nodeValue;
        temp.removeChild(temp.firstChild);
        return result;
    }

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://maps.googleapis.com/maps/api/js?region=MY&callback=window.app.initApp&libraries=places";
    document.body.appendChild(script);

    window.app = window.app || {};

    window.app.initApp = function () {
        window.app.view = new MasterView();
        window.app.router = new MapRouter();
        //start history service
        Backbone.history.start();
    }
})