class MapController {

  constructor(model, root) {
    this.model = model;
    this.root = root;
    model.addObserver(this.update); //to be able to get the search results
    this.render();

    this.loading = false;
    this.svgWidth = null;
    this.svgHeight = null;
    this.dimensions = {
      margin : { top: 10,
        right: 10,
        bottom: 10,
        left: 10}
    };
    this.sphere = ({type: 'Sphere'});
    this.locations = [];

    drawChart();

    new TimeGraph(model, document.body.querySelector('#timeGraph'));
  }

  render() {
    h('svg', {id: 'world-map'}, '').render(this.root);
  }

  //HERE WE HAVE ACCESS TO THE SEARCH RESULTS
  update(whatHappened) {
    if(whatHappened.searchResults) {
      handleLocation(whatHappened.searchResults).then(success => {
        if (!success) console.error('something happened fetching the data');
        drawChart();
      });
    }
  }
}

const mapData = {
  studiesWithLocation:  null,
  countryCount: null,
  studyCountryFeatures: null,
  studyLocationFeatures: null,
};

const drawChart = async () => {
  // redraw chart
  if (mapData.studiesWithLocation){
    const oldSvg = d3.select('#world-map');
    oldSvg.remove();
    d3.select('#geoMap')
      .append('svg')
      .attr('id', 'world-map');
  }

  const dimensions = {
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    }
  };

  const sphere = ({type: 'Sphere'});
  // const rect = document.body.querySelector('#world-map').getBoundingClientRect();
  const rect = document.body.querySelector('#visualization').getBoundingClientRect();
  const height = rect.height;
  const width = rect.width;
  const svgHeight = rect.height * 0.85;
  const svgWidth = rect.width * 0.95;
  const boundedWidth = svgWidth - 20;
  let centered;

  const projection = d3.geoEqualEarth().fitWidth(boundedWidth, sphere);

  const path = d3.geoPath(projection);
  const [[x0, y0], [x1, y1]] = path.bounds(sphere);
  dimensions.boundedHeight = y1;

  function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style('stroke-width', 1 / s).attr('transform', 'translate(' + t + ')scale(' + s + ')');
  }

  try {
    const geoJsonUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
    const data = await d3.json(geoJsonUrl);
    const features = topojson.feature(data, data.objects.countries).features;

    if (!mapData.studiesWithLocation){
      // static world map
      const svg = d3
        .select('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

      // Add background
      svg.append('rect')
        .attr('class', 'background')
        .attr('width', svgWidth)
        .attr('height', svgHeight);

      const bounds = svg.append('g')
        .style('transform',
          `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

      bounds
        .append('path')
        .attr('class', 'earth')
        .attr('d', path(sphere));

      bounds.selectAll('.country')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
          if (d.properties.name === 'Antarctica') return 'transparent';
          return '#6c757d';
        });
    } else {
      // zoomable map with study locations
      const zoomed = () => {
        const transform = d3.event.transform;

        if (transform.k > 1.2) {
          const studyCountries = d3.selectAll('.study-country');
          studyCountries.remove();

          const studiesLocations = bounds.selectAll('.study-location')
            .data(mapData.studyLocationFeatures)
            .enter()
            .append('path')
            .attr('r', _ => +1/transform.k)
            .attr('class', 'study-location')
            .attr('stroke', 'white')
            // .style('fill', '#007bff')
            .attr('d', path);

          d3.selectAll('.study-location').each(function(data) {
  	          this.classList.add(String(data.properties.status).replace(/ /g, '_').replace(",", ''));
            })

          studiesLocations
            .on('mouseenter', onMouseStudyLocationEnter)
            .on('mouseleave', onMouseLeave)
            .on('click', onStudyLocationClick)
            .transition().duration(1000);
        } else {
          const studyLocations  = d3.selectAll('.study-location');
          studyLocations.remove();

          const studiesLocations = bounds.selectAll('.study-country')
            .data(mapData.studyCountryFeatures)
            .enter()
            .append('path')
            .attr('r', d => +d.properties.count)
            .attr('class', 'study-country')
            .attr('stroke', 'white')
            .style('fill', '#007bff')
            .attr('d', path);

          studiesLocations
            .on('mouseenter', onMouseStudyCountryEnter)
            .on('mouseleave', onMouseLeave)
            .on('click', 'dblclick.zoom')
            .on('click', onStudyCountryClick)
            .transition().duration(1000);
        }

        g.attr('transform', transform);
        g.attr('stroke-width', 1 / transform.k);
      };

      const onMouseStudyLocationEnter = (datum, m,n) => {
        // highlight dot
        d3.select(n[m]).attr('style', 'fill: #000000 !important'); // this is overriding all styles! TODO: improve

        bounds.selectAll('.study-country')
          .style('fill', d => {
            return d.properties.title === datum.properties.title ? '#000000' : '';
          });

        // highlight corresponding search result
        const card = [...document.getElementsByClassName('card-title')]
          .find(({textContent}) => textContent === datum.properties.title);
        card.scrollIntoView({behavior: 'smooth'});
        card.parentElement.style.background = '#eee';

        // display tooltip
        const tooltip = d3.select('#tooltip');

        tooltip.select('#title')
          .text(datum.properties.title);

        tooltip.select('#info')
          .text(datum.properties.info);

        const [centerX, centerY] = path.centroid(datum);

        const x = centerX + dimensions.margin.left;
        const y = centerY + dimensions.margin.top;

        tooltip.style('transform', 'translate('
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px)`
      + ')');
        tooltip.style('opacity',1);
      };

      const onMouseStudyCountryEnter = (d,m,n) => {
        // highlight dot
        d3.select(n[m]).style('fill', '#000000');

        // display tooltip
        const tooltip = d3.select('#tooltip');

        tooltip.select('#title')
          .text(d.properties.title);

        tooltip.select('#info')
          .text(d.properties.info);

        const [centerX, centerY] = path.centroid(d);

        const x = centerX + dimensions.margin.left;
        const y = centerY + dimensions.margin.top;

        tooltip.style('transform', 'translate('
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px)`
      + ')');
        tooltip.style('opacity',1);
      };

      const onMouseLeave = ({properties}, x, y) => {
        d3.select(y[x]).style('fill', properties.status ? '' : '#007bff');

        const card = [...document.getElementsByClassName('card-title')]
          .find(({textContent}) => textContent === properties.title);

        if (card) card.parentElement.style.background = '#F8F9FA';

        const tooltip = d3.select('#tooltip');
        tooltip.style('opacity',0);
      };

      const onStudyLocationClick = ({properties}) => {
        window.open(properties.url, '_blank');
      };

      const onStudyCountryClick = (d) => {
        let x, y, k;

        const studyCountries = d3.selectAll('.study-country');
        studyCountries.remove();

        const studiesLocations = bounds.selectAll('.study-location')
          .data(mapData.studyLocationFeatures)
          .enter()
          .append('path')
          .attr('class', 'study-location')
          .attr('stroke', 'white')
          .style('fill', '#007bff')
          .attr('d', path);

        studiesLocations
          .on('mouseenter', onMouseStudyLocationEnter)
          .on('mouseleave', onMouseLeave)
          .on('click', 'dblclick.zoom')
          .transition().duration(1000);

        const centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 3;
        centered = d;

        g.transition()
          .duration(750)
          .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
          .style('stroke-width', 1.5 / k + 'px');


        // g.attr('transform', transform);
        // g.attr('stroke-width', 1 / transform.k);

        // g.selectAll('path')
        // .classed('active', centered && function(d) { return d === centered; });

        // g.transition()
        // .duration(750)
        // .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        // .style('stroke-width', 1.5 / k + 'px');
      };

      const zoom = d3.zoom()
      // .extent([[svgWidth, svgHeight], [width-(svgWidth*2), height-svgHeight]])
        .translateExtent([[0, 0], [width, height]])
      // .scaleExtent([1, 10])
      // .translateExtent([[svgWidth, svgHeight], [width-(svgWidth*2), height-svgHeight]])
        .scaleExtent([1, 3])
        .on('zoom', zoomed);

      const svg = d3
        .select('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        .call(zoom);

      // Add background
      svg.append('rect')
        .attr('class', 'background')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .call(zoom);

      const g = svg.append('g');

      const bounds = g.append('g')
        .style('transform',
          `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

      bounds
        .append('path')
        .attr('class', 'earth')
        .attr('d', path(sphere));

      bounds.selectAll('.country')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
          if (d.properties.name === 'Antarctica') return 'transparent';
          return '#6c757d';
        });

      bounds.selectAll('.country')
        .data(features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
          if (d.properties.name === 'Antarctica') return 'transparent';
          return '#6c757d';
        });

      mapData.studyCountryFeatures = createStudyCountryFeatures();
      mapData.studyLocationFeatures = createStudyLocationFeatures();

      const studyCountries = bounds.selectAll('.study-country')
        .data(mapData.studyCountryFeatures)
        .enter()
        .append('path')
        .attr('r', d => +d.properties.count)
        .attr('class', 'study-country')
        .attr('stroke', 'white')
        .style('fill', '#007bff')
        .attr('d', path);

      studyCountries
        .on('mouseenter', onMouseStudyCountryEnter)
        .on('mouseleave', onMouseLeave)
        .on('click','dblclick.zoom')
        .transition().duration(1000);
    }
  } catch(e) {
    console.error({e});
  }
};


const createStudyLocationFeatures = () => {
  const baseUrl = 'https://clinicaltrials.gov';
  const baseStudyUrl = '/ct2/show';
  return mapData.studiesWithLocation.map(study => {
    return study.locationObjects.map((addressInfo) => {
      return {
        type: 'Feature',
        properties: {
          status: study.OverallStatus[0],
          title: study.BriefTitle[0],
          info:  addressInfo.addressString,
          url: `${baseUrl}/${baseStudyUrl}/${study.NCTId[0]}`,
        },
        geometry: {
          type: 'Point',
          coordinates: addressInfo.coordinates,
        },
        id: study.Rank,
      };
    });
  }).flatMap(x => x);
};

const createStudyCountryFeatures = () => {
  return mapData.countryCount.map(({name, count, coordinates}, i) => {
    return {
      type: 'Feature',
      properties: {
        title:  name,
        info:  count > 1 ? `${count} Studies` : `${count} Study`,
        count: count,
      },
      geometry: {
        type: 'Point',
        coordinates: coordinates,
      },
      id: i,
    };
  });
};

function openCageRequest(address) {
  return new Promise((resolve, reject) => {
    const encodedAddress = encodeURIComponent(address);
    // console.error({address, encodedAddress});
    const apiKey = '77de00dfbb1047aba220e6c9a634128f';
    // const apiKey = 'cf88e1c88abc4207a8574f5be7eeaff7';
    // const apiKey = '0ad225737eb647299549b58683888838'
    const apiURL = 'https://api.opencagedata.com/geocode/v1/json';
    const requestURL = apiURL
    + '?'
    + 'key=' + apiKey
    + '&q=' + encodedAddress
    + '&pretty=1'
    + '&no_annotations=1';

    const request = new XMLHttpRequest();
    request.open('GET', requestURL, true);

    request.onload = function() {
      // see full list of possible response codes:
      // https://opencagedata.com/api#codes

      if (request.status == 200){
        // Success!
        const data = JSON.parse(request.responseText);
        resolve({coordinates: [data.results[0].geometry.lng, data.results[0].geometry.lat], countryName: data.results[0].components.country});
        // alert(data.results[0].formatted);
      } else if (request.status <= 500){
        // We reached our target server, but it returned an error
        console.log('unable to geocode! Response code: ' + request.status);
        const data = JSON.parse(request.responseText);
        reject({
          status: this.status,
          statusText: data ,
        });
        console.log(data.status.message);
      } else {
        reject({
          status: this.status,
          statusText: request.statusText
        });
        console.log('server error');
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      reject({
        status: this.status,
        statusText: request.statusText
      });
      console.log('unable to connect to server');
    };

    request.send();  // make the request
  });
}

async function geocode(address) {
  // return [];
  if (!address) return [];
  try {
    return await openCageRequest(address);
  } catch (error) {
    console.log('error', error.message);
  }
  return [];
}

async function createCountryCount(studies){
  const countryCount = new Map();
  if (studies){
    studies.map(study => {
      return study.locationObjects.map(({country})=> {
        if (country === '') return;
        if (countryCount.has(country)) {
          countryCount.set(country, countryCount.get(country) + 1);
        } else {
          countryCount.set(country, 1);
        }
      });
    });
    try {
      let data = [];
      for (let [country, count] of countryCount.entries()) {
        const {countryName, coordinates} = await this.geocode(country);
        data.push({
          name: countryName === 'United States' ? 'United States of America' : countryName,
          coordinates: coordinates,
          count: count,
        });
        // break; // draw only first
      }
      return data;
    } catch (err) {
      // if something goes wrong
      console.error('countryCountError', {err}, {countryCount});
    }
    return countryCount;
  }
  return [];
}

function createAddressString(addressList){
  if (addressList){
    const addressString = addressList.filter(x => x).join(', ');
    // console.log('createAddressStringsSuccess', {addressString});
    return addressString;
  }
  // if something goes wrong
  console.error('createAddressStringsError', {addresses});
  return [];
}

function createAddressObjects(study){
  if (study.LocationCity){
    const locationObjects = study.LocationCity.map((_,i)=>{
      const city = study.LocationCity[i];
      const state = study.LocationState[i];
      const country = study.LocationCountry[i];
      return {
        city: city !== undefined ? city : '',
        state: state !== undefined ? state : '',
        country: country !== undefined ? country : '',
        addressString: createAddressString([city, state, country])
      };
    });
    // console.log('createAddressObjectsSuccess', {locationObjects});
    return locationObjects;
  }
  // if something goes wrong
  console.error('createAddressObjectsError', {study});
  return [];
}

function extractLocationInfo(study) {
  if (study){
    const locationObjects = createAddressObjects(study);
    const item = {
      ...study,
      locationObjects: locationObjects,
    };
    // console.log('extractLocationInfoSuccess', {item});
    return item;
  }
  console.error('extractLocationInfoError', {study});
  return {};
}

async function handleLocation(results) {
  if (results) {
    const studies = results.map((x) => extractLocationInfo(x));
    try {
      const addresses = studies.map(({locationObjects})=> {
        return locationObjects.map(({addressString})=> {
          return addressString;
        });
      });
      const data = await Promise.all(await addresses.map(async x => await Promise.all(x.map(async y =>  await geocode(y)))));

      const studiesWithLocation = studies.map((study, i) => {
        return {
          ...study,
          locationObjects: study.locationObjects.map((locationObject, j) => {
            return {
              ...locationObject,
              // updating to country name from api that will work on the
              // world map metrics
              country: data[i][j].countryName,
              coordinates: data[i][j].coordinates,
            };
          })
        };
      });

      const filteredStudies = studiesWithLocation.filter(study => study.locationObjects.length);
      mapData.studiesWithLocation = filteredStudies;
      mapData.countryCount = await createCountryCount(filteredStudies);
      return true;
    } catch (e) {
      console.error({e});
    }
    return false;
  } else {
    return false;
  }
}
