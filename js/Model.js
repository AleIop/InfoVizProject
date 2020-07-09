class Model {

  constructor() {
    this.subscribers = [];
    this.iframeWidth = window.innerWidth * 0.65;
    this.results = [];
    this.locations = [];
    this.count = null;
    this.term1 = 'diabetes';
    this.term2 = 'heart';
    this.term3 = '';
    this.baseUrl = 'https://clinicaltrials.gov';
    this.query = '/api/query/study_fields?fmt=JSON&expr=SEARCH%5B';
    this.baseStudyUrl = '/ct2/show/';
    this.fields = 'BriefTitle,Condition,NCTId,LocationCity,LocationState,LocationCountry,OverallStatus,StudyType,StartDate,ResultsFirstSubmitDate';
    this.loading = null;
    this.map = true;
  }

  changeStatus(index) {
    console.log(index);
    const element = document.getElementById(`result-${index}`);
    if (element.classList.contains('highlight')) element.classList.remove('highlight');
    else element.classList.add('highlight');
  }

  navigateToTreeMap() {
    this.map = !this.map;
  }

  // TO NOTIFY THE CONTROLLERS OF CHANGES IN THE MODEL
  addObserver(callback){
    this.subscribers.push(callback);
  }
  notifyObservers(whatHappened){
    this.subscribers.forEach(callback =>
      callback(whatHappened)
    );
  }

  // HERE THE QUERY IS ASSEMBLED
  search(condition, study, keyword, types, statuses, countries, min, max) {
    // Replace variables in case they are falsy (e.g. empty string, null, undefined)
    condition = condition || '';
    study = study || '';

    //the following are arrays, because the dropdown menus contain checkboxes
    // console.log(statuses);

    this.loading = true;
    let queryBuilder = '';

    //CONDITION OR DISEASE
    if (condition !== '') queryBuilder = `Study%5D%28AREA%5BCondition%5D+${condition.replace(' ', '+')}`;

    //STUDY NAME
    if (study !== '') {
      if (queryBuilder != '') queryBuilder += '+AND+'; //if the previous inputs aren't filled in
      else queryBuilder += 'Study%5D%28';
      queryBuilder += `AREA%5BBriefTitle%5DCOVERAGE%5BContains%5DEXPANSION%5BConcept%5D+${study.replace(' ', '+')}`;
    }

    //OTHER TERMS
    if (keyword !== '') {
      if (queryBuilder != '') queryBuilder += '+AND+'; //if the previous inputs aren't filled in
      else queryBuilder += 'Study%5D%28';
      queryBuilder += `AREA%5BInterventionName%5DCOVERAGE%5BContains%5DEXPANSION%5BLossy%5D+${keyword.replace(' ', '+')}+OR+AREA%5BInterventionOtherName%5DCOVERAGE%5BContains%5DEXPANSION%5BLossy%5D+${keyword.replace(' ', '+')}`;
    }

    //STUDY TYPE
    if (JSON.stringify(types) != JSON.stringify(['dropdown', 'div-filter'])) {
      if (queryBuilder != '') queryBuilder += '+AND+'; //if the previous inputs aren't filled in
      else queryBuilder += 'Study%5D%28';
      queryBuilder += `AREA%5BStudyType%5DCOVERAGE%5BFullMatch%5DEXPANSION%5BNone%5D+%28${types[0].replace(/_/g, '+')}`;
      if (statuses.length > 1)
        for(let i = 1; i < types.length; i++) queryBuilder += `+OR+${types[i].replace(/_/g, '+')}`;
      queryBuilder += '%29';
    }

    //STATUS
    if (JSON.stringify(statuses) != JSON.stringify(['dropdown', 'div-filter'])) {
      if(statuses[0] == 'Active_not_recruiting') statuses[0] = 'Active,_not_recruiting';

      if (queryBuilder != '') queryBuilder += '+AND+'; //if the previous inputs aren't filled in
      else queryBuilder += 'Study%5D%28';
      queryBuilder += `AREA%5BOverallStatus%5DCOVERAGE%5BFullMatch%5DEXPANSION%5BNone%5D+%28${statuses[0].replace(/_/g, '+')}`;
      if (statuses.length > 1)
        for(let i = 1; i < statuses.length; i++) queryBuilder += `+OR+${statuses[i].replace(/_/g, '+')}`;
      queryBuilder += '%29';
    }

    //COUNTRY
    if (JSON.stringify(countries) != JSON.stringify(['dropdown', 'div-filter'])) {
      if (queryBuilder != '') queryBuilder += '%29+AND+SEARCH%5B'; //if the previous inputs aren't filled in
      queryBuilder += `Location%5D%28AREA%5BLocationCountry%5DCOVERAGE%5BFullMatch%5DEXPANSION%5BNone%5D+%28${countries[0].replace(/_/g, '+')}`;
      if (countries.length > 1)
        for(var i = 1; i < countries.length; i++) queryBuilder += `+OR+${countries[i].replace(/_/g, '+')}`;
      queryBuilder += '%29';
    }

    // console.log("Query:" + queryBuilder);

    if (queryBuilder == '') {
      window.alert('Fill in at least one search input!');
      return;
    }

    queryBuilder += `%29&fields=${this.fields}`;
    if (min != '' && max != '') queryBuilder += `&min_rnk=${min}&max_rnk=${max}`;
    // Search and notify observers that the results have changed
    this.retrieve(this.baseUrl + this.query + queryBuilder)
      .then((data) => {
        this.notifyObservers({
          searchResults: data.StudyFieldsResponse.StudyFields,
          NStudiesFound: data.StudyFieldsResponse.NStudiesFound,
          param: [condition, study, keyword, types, statuses, countries],
          minRank : data.StudyFieldsResponse.MinRank,
          maxRank : data.StudyFieldsResponse.MaxRank});
        this.map=true;
        this.loading = false;
      });
  }

  // HERE THE QUERY IS FETCHED
  retrieve(query) {
    console.log({query});
    const controller = new AbortController();
    const ret = fetch(query, {
      signal: controller.signal,
      'method': 'GET',
    //   "headers": {
    //     'X-Mashape-Key': API_KEY
    //   }
    })
      .then(response => response.json())   // from headers to response data
      .catch(error => console.log(error.message)); //this doesn't work!
    ret.abort = () => controller.abort();
    return ret;
    //return null
  }

  createResultCard(result) {
    //console.log(model.locationToString.call(result.LocationCity[0], result.LocationCountry[0]));

    var returnH =  h('div', {class: 'card-body'},
      h('div', {class: 'card-first-row'},
        h('p', {class: 'result-rank card-text text-muted'}, result.Rank),
        h('p', {class: 'has-result card-text text-muted'}, (result.ResultsFirstSubmitDate[0] == undefined) ? "No results" : "Has results")),
      h('h5', {class: 'card-title'},
        h('a', {target: '_blank', href: model.baseUrl + model.baseStudyUrl + result.NCTId[0]}, result.BriefTitle[0])), // CHANGE THIS
      h('p', {class: 'card-text'},
        h('p', {class: 'text-muted'}, result.Condition.join(', '))),
      h('div', {class: 'card-last-row'},
        h('p', {class: 'text-muted status'}, result.OverallStatus[0]),
        h('p', {class: 'text-muted country'}, '')),
    );

    var locationString = result.LocationCity[0] + ', ';
    d3.tsv('./js/util/countries.tsv', (data, i) => {
      if (data.Name == result.LocationCountry[0]) {
        locationString += data.Code;
        returnH.querySelector('.country').textContent = locationString;
      }
    });

    return returnH;
  }

}
