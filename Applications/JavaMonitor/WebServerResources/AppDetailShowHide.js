/* 
 * --------------------------------------------------------------------------  
 * Purpose:
 * 	To add hide/show capabilities via javascript to existing JavaMonitor functionality
 *
 * Contributed to Project Wonder, open-source, "as-is"
 * No warranties expressed or implied. 
 * 
 *  Written by Marco A. Gonzalez, Codivus Corporation
 *  http://www.amagavi.com
 *  http://www.codivus.com
 *  email: marcoinc@mac.com
 *
 *
 * Dependency:
 *  Prototype javascript framework (http://prototypejs.org/)
 *  that adds show() and hide()
 *  to HTML DOM elements.
 *  Not sure what the minimum required version is but it works with v1.7.3
 *  Prototype was already used in JavaMonitor (vs. JQuery), so I used it.
 * 
 * --------------------------------------------------------------------------
 */

// use single variable to encapsulate all functionality so as
// not to pollute the global namespace

// See http://www.jslint.com/
/*global
    window
*/
var CodMonitor = {
  preferences: {
    localStorageKeyName: "Codivus.JavaMonitor.Preferences",
    detailView: {
        showInstances: "All", /* values: All, Running, NotRunning */
        nonRunningInstanceStatistics: "Consider", /* values: Consider, Ignore */
        shouldWrapColumn_Name: false,
        shouldAddRowNumbers: true,
        startIgnoreFlag: "<!--ignored: ",
        endIgnoreFlag: "-->",
        shouldShowColumn: {
          scheduled: true,
          nextShutdown: true,
          deaths: true
        }
    }
  },

  numberOfColumnsHidden: function() {
  	"use strict";
    var count = 0;
    var shouldShowColumnPrefs = this.preferences.detailView.shouldShowColumn;
    if (shouldShowColumnPrefs.scheduled === false) {
      count += 1;
    }
    if (shouldShowColumnPrefs.nextShutdown === false) {
      count += 1;
    }
    if (shouldShowColumnPrefs.deaths === false) {
      count += 1;
    }
    return count;
  },


  updateColSpanInTotalsForRunningInstances: function() {
  	"use strict";
    var td = document.querySelector("tr.TotalsForRunningInstances > td.label");
    if (td) {
	    var standardColumnCount = 10;
	    var updatedColspan;
	    var hiddenColumnsCount = this.numberOfColumnsHidden();
	    updatedColspan = standardColumnCount - hiddenColumnsCount;
	    td.setAttribute("colspan", updatedColspan.toString());
    }
  },


  /*
    Returns an array of elements matching selectors,
    and whose textContent === theText
    The whitespace on each end of the strings is ignored
  */
  getQueriedElementsWithTextContent: function(selectors, theText) {
  	"use strict";
    var elements = [];
    if (theText) {
      var textToMatch = theText.trim();
      var matching = document.querySelectorAll(selectors);
      if (matching) {
        matching.forEach(
          function(element) {
            if (element.textContent) {
              if (textToMatch === element.textContent.trim()) {
                elements.push(element);
              }
            }
          }
        );
      }
    }
    return elements;
  },


  isModeShowingStatistics: function() {
  	"use strict";
    var selector = "div.Box.ApplicationDetailsBox > p > a";
    var showStatsLink = this.getQueriedElementsWithTextContent(selector, "Hide Stats");
    var isShowingStats = (showStatsLink.length !== 0);
    return isShowingStats;
  },


  /*
    Relies on javascript Prototypejs to have extended the DOM
    to add show() and hide() methods to HTMLElements
    If element is falsy, do nothing.
    if element is truthy, then it's expected to have implemented show() and hide().
  */
  showHideElement: function(element, shouldShow) {
  	"use strict";
    if (element) {
      if (shouldShow) {
        element.show();
      } else {
        element.hide();
      }
    }
  },


  /*
    Changes the onclick handler based on the value of shouldShow
  */
  updateShowHideLink: function(link, displayName, onclickFunctionName, shouldShow) {
  	"use strict";
    var linkID = link.getAttribute("id");
    var shouldNotShow = !shouldShow;
    var onclickValue = onclickFunctionName + "("
                        + shouldNotShow.toString()
                        + ", "
                        + "'" + linkID + "'"
                        + ");";
    link.setAttribute( "onclick", onclickValue);
    if (shouldShow) {
      link.innerHTML = "Hide " + displayName;
    } else {
      link.innerHTML = "Show " + displayName;
    }
  },


  showHideTableData: function(tdSelector, shouldShow) {
  	"use strict";
    var that = this;
    var rows = this.instanceRows();
    rows.forEach(
      function(row) {
        var td = row.querySelector(tdSelector);
        that.showHideElement(td, shouldShow);
      }
    );
  },


  /*
  */
  adjustRowNumbers: function() {
  	"use strict";
    var shouldAddRowNumbers = this.preferences.detailView.shouldAddRowNumbers;
    var rows = this.instanceRows();
    var rowNumber = 1;
    var td;
    rows.forEach(
      function(row) {
        td = row.querySelector("td.RowNumber");
        if (shouldAddRowNumbers) {
          if (td === null) {
            td = document.createElement("td");
            td.setAttribute("class", "RowNumber");
            td.innerHTML = rowNumber.toString();
            rowNumber += 1;
          } else {
            td.show();
          }
        } else {
          if (td) {
            td.hide();
          }
        }
      }
    );
  },


  /*
    the name of this function after the underbar must match the property name
      this.preferences.detailView.shouldShowColumn[propertyName];

    this is the onclick handler
  */
  showHideColumn_deaths: function(shouldShow, linkID){
  	"use strict";
    var that = this;
    var tableBodySelector = "div.Box.ApplicationDetailsBox > table > tbody";
    var th = document.querySelector(tableBodySelector + " > tr:nth-child(1) > th:nth-child(10)");
    that.showHideElement(th, shouldShow);

    that.showHideTableData("td.DeathCount", shouldShow);

    var tdFooter = document.querySelector(tableBodySelector + " > tr > td.AllClearDeaths");
    that.showHideElement(tdFooter, shouldShow);

    var link = document.getElementById(linkID);
    var displayName = "Deaths";
    var propertyName = "deaths";
    var onclickFunctionName = "CodMonitor.showHideColumn_" + propertyName;
    that.updateShowHideLink(link, displayName, onclickFunctionName, shouldShow);

    this.preferences.detailView.shouldShowColumn[propertyName] = shouldShow;
    this.savePreferencesToLocalStorage();
    this.updateColSpanInTotalsForRunningInstances();
  },


  /*
    the name of this function after the underbar must match the property name
      this.preferences.detailView.shouldShowColumn[propertyName];

    this is the onclick handler
  */
  showHideColumn_nextShutdown: function(shouldShow, linkID){
  	"use strict";
    var that = this;
    var tableBodySelector = "div.Box.ApplicationDetailsBox > table > tbody";
    var th = document.querySelector(tableBodySelector + " > tr:nth-child(1) > th:nth-child(9)");
    that.showHideElement(th, shouldShow);

    that.showHideTableData("td.NextShutDown", shouldShow);

    var tdFooter = document.querySelector(tableBodySelector + " > tr > td.AllBounce");
    that.showHideElement(tdFooter, shouldShow);

    var link = document.getElementById(linkID);
    var displayName = "Next shutdown";
    var propertyName = "nextShutdown";
    var onclickFunctionName = "CodMonitor.showHideColumn_" + propertyName;
    that.updateShowHideLink(link, displayName, onclickFunctionName, shouldShow);

    this.preferences.detailView.shouldShowColumn[propertyName] = shouldShow;
    this.savePreferencesToLocalStorage();
    this.updateColSpanInTotalsForRunningInstances();
  },

  /*
    the name of this function after the underbar must match the property name
      this.preferences.detailView.shouldShowColumn[propertyName];

    this is the onclick handler
  */
  showHideColumn_scheduled: function(shouldShow, linkID){
  	"use strict";
    var that = this;
    var tableBodySelector = "div.Box.ApplicationDetailsBox > table > tbody";
    var th = document.querySelector(tableBodySelector + " > tr:nth-child(1) > th:nth-child(8)");
    that.showHideElement(th, shouldShow);

    that.showHideTableData("td.InstanceSchedule", shouldShow);

    var tdFooter = document.querySelector(tableBodySelector + " > tr > td.AllScheduling");
    that.showHideElement(tdFooter, shouldShow);

    var link = document.getElementById(linkID);
    var displayName = "Scheduled";
    var propertyName = "scheduled";
    var onclickFunctionName = "CodMonitor.showHideColumn_" + propertyName;
    that.updateShowHideLink(link, displayName, onclickFunctionName, shouldShow);

    this.preferences.detailView.shouldShowColumn[propertyName] = shouldShow;
    this.savePreferencesToLocalStorage();
    this.updateColSpanInTotalsForRunningInstances();
  },


  createLinkToShowHideColumn: function(propertyName, displayName){
  	"use strict";
    var shouldShowColumn = this.preferences.detailView.shouldShowColumn[propertyName];

    var onclickFunctionName = "CodMonitor.showHideColumn_" + propertyName;
    var linkID = "ShowHideColumn_" + propertyName + "_ID";

    var link = document.createElement("a");
    link.setAttribute("href", "#");
    link.setAttribute("id", linkID);
    link.setAttribute("class", "ShowHideColumn");
    this.updateShowHideLink(link, displayName, onclickFunctionName, shouldShowColumn);
    return link;
  },


  createLinksToShowHideColumns: function() {
  	"use strict";
    var links = document.querySelectorAll("div.Box.ApplicationDetailsBox > p a");
    if (links.length === 2){
      // var linkToRefresh = links[0];
      // var linkToShowHideStats = links[1];
      var pTagForLinks = document.querySelector("div.Box.ApplicationDetailsBox > p:nth-child(5)");

      // add-ons haven't been added yet
      var shouldShowColumn;
      var link;
      var propertyName;
      var linkID;
      var displayName;

      propertyName = "scheduled";
      displayName = "Scheduled";
      linkID = "ShowHideColumn_" + propertyName + "_ID";
      shouldShowColumn = this.preferences.detailView.shouldShowColumn[propertyName];
      link = this.createLinkToShowHideColumn(propertyName, displayName);
      pTagForLinks.appendChild(link);
      this.showHideColumn_scheduled(shouldShowColumn, linkID);

      propertyName = "nextShutdown";
      displayName = "Next shutdown";
      linkID = "ShowHideColumn_" + propertyName + "_ID";
      shouldShowColumn = this.preferences.detailView.shouldShowColumn[propertyName];
      link = this.createLinkToShowHideColumn(propertyName, displayName);
      pTagForLinks.appendChild(link);
      this.showHideColumn_nextShutdown(shouldShowColumn, linkID);

      propertyName = "deaths";
      displayName = "Deaths";
      linkID = "ShowHideColumn_" + propertyName + "_ID";
      shouldShowColumn = this.preferences.detailView.shouldShowColumn[propertyName];
      link = this.createLinkToShowHideColumn(propertyName, displayName);
      pTagForLinks.appendChild(link);
      this.showHideColumn_deaths(shouldShowColumn, linkID);
    }
  },


  /*
    Return the HTML table rows that represent application instances
    The rows will not include header rows
    Returns empty array if none found
  */
  instanceRows: function() {
  	"use strict";
    var rows = [];
    // FYI: querySelectorAll returns a NodeList which does not support javascript Array filter function
    var allRows = document.querySelectorAll("div.Box.ApplicationDetailsBox > table > tbody > tr");
    allRows.forEach(
      function(row) {
        if (CodMonitor.isRowAnInstanceRow(row)) {
          rows.push(row);
        }
      }
    );
    return rows;
  },

  /* helps bypass header rows of the table */
  isRowAnInstanceRow: function(htmlTableRow) {
  	"use strict";
    return htmlTableRow.querySelector("td.InstanceStatusColumn") !== null;
  },

  isRowARunningInstance: function(htmlTableRow) {
  	"use strict";
    return htmlTableRow.querySelector('td.InstanceStatusColumn > img[alt="ON"]') !== null;
  },


  isRowANotRunningInstance: function(htmlTableRow) {
  	"use strict";
    return htmlTableRow.querySelector('td.InstanceStatusColumn > img[alt="OFF"]') !== null;
  },


  rowsThatAreRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    var runningRows = rows.filter(CodMonitor.isRowARunningInstance);
    return runningRows;
  },


  rowsThatAreNotRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    var filteredRows = rows.filter(CodMonitor.isRowANotRunningInstance);
    return filteredRows;
  },


  /*
    onclick handler
  */
  showOnlyRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    rows.forEach(
      function(row) {
        if (CodMonitor.isRowARunningInstance(row)){
          row.show();
        } else {
          row.hide();
        }
      }
    );
    CodMonitor.preferences.detailView.showInstances = "Running";
    CodMonitor.savePreferencesToLocalStorage();
  },


  numberOfRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.rowsThatAreRunningInstances();
    var count = rows.length;
    return count;
  },


  numberOfNotRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.rowsThatAreNotRunningInstances();
    var count = rows.length;
    return count;
  },


  numberOfAllInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    var count = rows.length;
    return count;
  },


  /*
    onclick handler
  */
  showOnlyNotRunningInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    rows.forEach(
      function(row) {
        if (CodMonitor.isRowANotRunningInstance(row)){
          row.show();
        } else {
          row.hide();
        }
      }
    );
    CodMonitor.preferences.detailView.showInstances = "NotRunning";
    CodMonitor.savePreferencesToLocalStorage();
  },


  /*
    onclick handler
  */
  showAllInstances: function() {
  	"use strict";
    var rows = CodMonitor.instanceRows();
    rows.forEach(
      function(row) {
        row.show();
      }
    );

    CodMonitor.preferences.detailView.showInstances = "All";
    CodMonitor.savePreferencesToLocalStorage();
  },


  considerOrIgnoreStatisticsInRowWithSelectors: function(shouldConsider, row, selectors) {
  	"use strict";
    selectors.forEach(
      function(selector) {
        var td = row.querySelector(selector);
        if (td) {
	        var html = td.innerHTML;
	        if (shouldConsider) {
	          if (CodMonitor.isHTMLIgnored(html)) {
	            td.innerHTML = CodMonitor.unwrapIgnoreFlagsFromContent(html);
	          }
	        } else {
	          if (html) {
	            td.innerHTML = CodMonitor.wrapWithIgnoreFlags(html);
	          }
	        }        
        }
      }
    );
  },


  isHTMLIgnored: function(html) {
  	"use strict";
    var isIgnored;
    var startIgnore = CodMonitor.preferences.detailView.startIgnoreFlag;
    var endIgnore = CodMonitor.preferences.detailView.endIgnoreFlag;
    if (html && html.includes(startIgnore) && html.includes(endIgnore) ){
      isIgnored = true;
    } else {
      isIgnored = false;
    }
    return isIgnored;
  },


  wrapWithIgnoreFlags: function(html) {
  	"use strict";
    var wrapped;
    if (html && !CodMonitor.isHTMLIgnored(html)) {
      var startIgnore = CodMonitor.preferences.detailView.startIgnoreFlag;
      var endIgnore = CodMonitor.preferences.detailView.endIgnoreFlag;
      wrapped = startIgnore + html + endIgnore;
    } else {
      wrapped = html;
    }
    return wrapped;
  },


  unwrapIgnoreFlagsFromContent: function(html) {
  	"use strict";
    var content;
    if (html) {
      var startIgnore = CodMonitor.preferences.detailView.startIgnoreFlag;
      var endIgnore = CodMonitor.preferences.detailView.endIgnoreFlag;

      var startContentIndex = html.indexOf(startIgnore) + startIgnore.length;
      var endContentIndex = html.indexOf(endIgnore, startContentIndex);
      content = html.substring(startContentIndex, endContentIndex);
    } else {
      content = html;
    }
    return content;
  },


  statisticsValueForShouldIgnore: function(shouldIgnore) {
	"use strict";  
    var statisticsValue;
    if (shouldIgnore) {
      statisticsValue = "Ignore";
    } else {
      statisticsValue = "Consider";
    }
    return statisticsValue;
  },


  /*
    onclick handler
  */
  ignoreStatisticsForNonRunningInstances: function(shouldIgnore) {
	"use strict";  
    var selectors = [];
    selectors.push("td.TransactionsCount");
    selectors.push("td.ActiveSessionCount");
    selectors.push("td.AverageTransactionsCount");
    selectors.push("td.AverageIdlePeriod");

    var rows = this.rowsThatAreNotRunningInstances();
    var row;
    var i;
    var rowCount = rows.length;
    for (i = 0; i < rowCount; i += 1) {
      row = rows[i];
      CodMonitor.considerOrIgnoreStatisticsInRowWithSelectors(
        !shouldIgnore, row, selectors
      );
    }

    var statisticsValue = this.statisticsValueForShouldIgnore(shouldIgnore);
    CodMonitor.preferences.detailView.nonRunningInstanceStatistics = statisticsValue;
    CodMonitor.savePreferencesToLocalStorage();
  },


  makeRadioButtonInsideLabel: function(id, radioName, radioValue, textLabel, isChecked, onclick) {
	"use strict";  
    var labelTag = document.createElement("label");

    var radioButton = document.createElement("input");
    radioButton.setAttribute("type", "radio");

    if (id) {
      radioButton.setAttribute("id", id);
    }
    if (radioName) {
      radioButton.setAttribute("name", radioName);
    }
    if (radioValue) {
      radioButton.setAttribute("value", radioValue);
    }
    if (isChecked === true) {
      radioButton.setAttribute("checked", "checked");
    }

    if (onclick) {
      radioButton.setAttribute("onclick", onclick);
    }

    labelTag.appendChild(radioButton);
    var radioLabel = document.createTextNode(textLabel);

    labelTag.appendChild(radioLabel);

    return labelTag;
  },


  addAbilityToIgnoreStatisticsForNotRunningInstances: function() {
	"use strict";  
    var divForIgnoreStatistics = document.createElement("div");
    divForIgnoreStatistics.setAttribute("id", "IgnoreStatisticsDivID");

    var divForAppDetailsBox = document.querySelector("div.Box.ApplicationDetailsBox");
    var divFirstChild = divForAppDetailsBox.childNodes[0];

    var divForText = document.createElement("div");
    divForText.setAttribute("id", "IgnoreStatisticsTextID");
    divForText.innerHTML = "For not running instances...";
    divForIgnoreStatistics.appendChild(divForText);

    var radioGroupName = "ConsiderOrIgnoreStatistics";

    var statisticsValue = this.preferences.detailView.nonRunningInstanceStatistics;

    var considerValue = {
      isChecked: undefined,
      onclickHandler: undefined
    };

    var ignoreValue = {
      isChecked: undefined,
      onclickHandler: undefined
    };

    considerValue.onclickHandler = "CodMonitor.ignoreStatisticsForNonRunningInstances(false);";
    ignoreValue.onclickHandler = "CodMonitor.ignoreStatisticsForNonRunningInstances(true);";

    switch(statisticsValue) {
      case "Consider":
        considerValue.isChecked = true;
        ignoreValue.isChecked = !considerValue.isChecked;
        CodMonitor.ignoreStatisticsForNonRunningInstances(false);
        break;

      case "Ignore":
        considerValue.isChecked = false;
        ignoreValue.isChecked = !considerValue.isChecked;
        CodMonitor.ignoreStatisticsForNonRunningInstances(true);
        break;

      default:
        // self-heal preference to a valid values
        considerValue.isChecked = true;
        ignoreValue.isChecked = !considerValue.isChecked;
        CodMonitor.ignoreStatisticsForNonRunningInstances(false);

        this.preferences.detailView.nonRunningInstanceStatistics = considerValue.isChecked;
        this.savePreferencesToLocalStorage();
    }

    var considerStatisticsLabel = "Show statistics";
    var radioButtonForConsider = CodMonitor.makeRadioButtonInsideLabel(
        "ConsiderStatisticsID", radioGroupName, "considerStatistics",
        considerStatisticsLabel, considerValue.isChecked,
        considerValue.onclickHandler
    );
    divForIgnoreStatistics.appendChild(radioButtonForConsider);

    var ignoreStatisticsLabel = "Hide statistics";
    var radioButtonForIgnore = CodMonitor.makeRadioButtonInsideLabel(
      "IgnoreStatisticsID", radioGroupName, "ignoreStatistics",
      ignoreStatisticsLabel, ignoreValue.isChecked,
      ignoreValue.onclickHandler
    );
    divForIgnoreStatistics.appendChild(radioButtonForIgnore);

    divForAppDetailsBox.insertBefore(divForIgnoreStatistics, divFirstChild);
  },


  addAbilityToShowOrHideInstances: function() {
	"use strict";  
    var storedShowInstanceValue = CodMonitor.preferences.detailView.showInstances;

    var divForAppDetailsBox = document.querySelector("div.Box.ApplicationDetailsBox");
    var divFirstChild = divForAppDetailsBox.childNodes[0];

    var radioDiv = document.createElement("div");
    radioDiv.setAttribute("id", "ShowHideInstancesDivID");

    var radioGroupName = "ShowHideInstances";

    var allInstancesLabel = "Show all " + CodMonitor.numberOfAllInstances().toString() + " instances";
    var allInstancesValue = "All";
    var allInstancesIsChecked = (allInstancesValue === storedShowInstanceValue);
    var radioButtonForAllInstances = CodMonitor.makeRadioButtonInsideLabel(
        "AllInstancesID", radioGroupName, allInstancesValue,
        allInstancesLabel, allInstancesIsChecked,
        "CodMonitor.showAllInstances();"
    );
    radioDiv.appendChild(radioButtonForAllInstances);
    if (allInstancesIsChecked) {
      CodMonitor.showAllInstances();
    }

    var runningInstancesLabel = "Show the " + CodMonitor.numberOfRunningInstances().toString() + " running instances";

    var runningInstancesValue = "Running";
    var runningInstancesIsChecked = (runningInstancesValue == storedShowInstanceValue);
    var radioButtonForRunning = CodMonitor.makeRadioButtonInsideLabel(
      "OnlyRunningInstancesID", radioGroupName, runningInstancesValue,
      runningInstancesLabel, runningInstancesIsChecked,
      "CodMonitor.showOnlyRunningInstances();"
    );
    radioDiv.appendChild(radioButtonForRunning);
    if (runningInstancesIsChecked) {
      CodMonitor.showOnlyRunningInstances();
    }

    var notRunningInstancesLabel = "Show the " + CodMonitor.numberOfNotRunningInstances().toString() + " not running instances";
    var notRunningInstancesValue = "NotRunning";
    var notRunningInstancesIsChecked = (notRunningInstancesValue === storedShowInstanceValue);
    radioDiv.appendChild(
      CodMonitor.makeRadioButtonInsideLabel(
        "OnlyNotRunningInstancesID", radioGroupName, notRunningInstancesValue,
        notRunningInstancesLabel, notRunningInstancesIsChecked,
        "CodMonitor.showOnlyNotRunningInstances();"
      )
    );
    if (notRunningInstancesIsChecked) {
      CodMonitor.showOnlyNotRunningInstances();
    }

    divForAppDetailsBox.insertBefore(radioDiv, divFirstChild);
  },


  addNewUserInterfaceElements: function() {
	"use strict";  
    this.addAbilityToShowOrHideInstances();
    this.addAbilityToIgnoreStatisticsForNotRunningInstances();
    this.createLinksToShowHideColumns();
  },


  isLocalStorageAvailable: function() {
	"use strict";  
  
    // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    var type = "localStorage";
	var x = "__storage_test__";
	var storage;
    try {
        storage = window[type];
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
    	var isDOMException = (e instanceof DOMException);
        return isDOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === "QuotaExceededError" ||
            // Firefox
            e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
  },


  savePreferencesToLocalStorage: function() {
	"use strict";  
    var preferences = this.preferences;
    var keyName = this.preferences.localStorageKeyName;
    var storablePreferences = JSON.stringify(preferences);
    localStorage.setItem(keyName, storablePreferences);
  },


  loadPreferencesFromLocalStorage: function() {
	"use strict";  
    var keyName = this.preferences.localStorageKeyName;
    var storedPreferences = localStorage.getItem(keyName);
    if (storedPreferences){
      this.preferences = JSON.parse(storedPreferences);
    }
  },


  showHideTotalsForRunningInstances: function() {
	"use strict";  
    var isShowingStatistics = this.isModeShowingStatistics();
    var row = document.querySelector("tr.TotalsForRunningInstances");
    if (row) {
	    if (isShowingStatistics) {
	      row.show();
	    } else {
	      row.hide();
	    }
    }
  },

  initialize: function() {
	"use strict";  
    if (this.isLocalStorageAvailable) {
      this.loadPreferencesFromLocalStorage();
    }
    this.addNewUserInterfaceElements();
    this.showHideTotalsForRunningInstances();
  }
};

