// lib/Metadata.ts
export type AnyObj = Record<string, any>;

// audio categories
export const AUDIO_CATEGORIES = [
  'audio',
  'sound',
  'speechrecording',
  'speech',
  'audio visual',
] as const;

// IIIF formats (image media types)
export const IIIF_FORMATS = ['image/jpeg', 'image/png', 'image/tiff'] as const;
export const PUBLIC_ACCESS_TITLE = ['public', 'öffentlich'] as const;

type ResourceItem =
  | {
      id: string;
      title?: string;
      value?: string;
      accessrestriction?: string;
      vocabsid?: string | number;
      [k: string]: any;
    }
  | Record<string, any>;

function addExternalURLIfNeeded<T extends AnyObj>(v: T): T {
  // PHP: if (isset($v['property'])) { $this->addExternalURL($v); }
  // You can augment here if needed (e.g., build a clickable URL from `property`).
  return v;
}

export class Metadata {
  private data: Record<string, any>;
  private mainId: string;
  private mainLang: string;
  private properties: Record<string, any> = {};

  constructor(data: AnyObj, language: string) {
    this.data = data.data;
    this.mainId = this.data.id;
    this.mainLang = language;
    //iterate data into properties
    this.#transformProperties();
  }

  #transformProperties() {
    for (const [prop, v] of Object.entries(this.data)) {
      if (!v || Array.isArray(v) || typeof v !== 'object') continue;
      const propvals = Object.values(v) as AnyObj[];
      for (const bucket of propvals) {
        if (!bucket || typeof bucket !== 'object') continue;

        // 1️⃣ Try preferred language
        let chosen = bucket[this.mainLang];

        // 2️⃣ If missing, get the first language bucket
        if (!chosen) {
          const firstAvailable = Object.values(bucket)[0];
          chosen = firstAvailable;
        }

        if (!chosen) continue;

        // 3️⃣ Now handle array vs. single object
        const store = (val: any) => {
          if (Array.isArray(val)) {
            this.properties[prop] = val.map(addExternalURLIfNeeded);
          } else if (val && typeof val === 'object') {
            const item = addExternalURLIfNeeded(val);
            if (item?.type === 'REL') {
              if (!Array.isArray(this.properties[prop]))
                this.properties[prop] = [];
              this.properties[prop].push(item);
            } else {
              this.properties[prop] = item;
            }
          }
        };

        store(chosen);
      }
    }
  }

  isPublic(): boolean {
    const accessress = this.getAccessRestriction();
    /*
     * If there is no accessrestriction, then it is a collection
     */
    if (!accessress || Object.keys(accessress).length === 0) {
      return true;
    }

    if (PUBLIC_ACCESS_TITLE.includes(accessress.title)) {
      return true;
    }
    return false;
  }

  getDownloadCardAccess(): bool {
    return this.isPublic();
  }

  getDisseminationCategories(): string {
    //we display only public resources
    if (!this.isPublic()) {
      return '';
    }

    const category = this.getAcdhCategory()?.toLowerCase();
    const vocabs = this.getAcdhCategoryVocabsId()?.toLowerCase();
    const format = this.getFormat()?.toLowerCase();
    const fileName =
      this.getDataByProperty('acdh:hasFilename')?.[0]?.['value'] ?? '';

    if (AUDIO_CATEGORIES.includes(category)) {
      return 'audio';
    }

    if (category === 'text') {
      if (format?.includes('pdf')) {
        return 'pdf';
      }
    }

    if (category === '3d data' || category === '3d-daten') {
      if (format?.includes('gltf')) {
        return 'glb';
      }

      if (fileName && fileName.includes('.ply')) {
        return 'ply';
      }
    }

    if (vocabs && vocabs.includes('/image')) {
      if (IIIF_FORMATS.includes(format)) {
        return 'image';
      }
    }

    if (category === 'xml/tei' || category === 'dataset') {
      if (fileName && fileName.includes('.xml')) {
        return 'tei';
      }
    }

    return '';
  }

  getMapType(): string {
    const wkt =
      this.data?.['acdh:hasWKT']?.[this.mainId]?.[this.mainLang]?.[0]?.value;
    const coordinate =
      this.data?.['acdh:hasLatitude']?.[this.mainId]?.[this.mainLang]?.[0]
        ?.value;

    if (wkt && wkt.toLowerCase().includes('multipolygon')) {
      return 'multipolygon';
    } else if (wkt && wkt.toLowerCase().includes('polygon')) {
      return 'polygon';
    } else if (coordinate) {
      return 'coordinates';
    }
    return '';
  }

  getMapPolygon(): string {
    const wkt =
      this.data?.['acdh:hasWKT']?.[this.mainId]?.[this.mainLang]?.[0]?.value;
    if (wkt) {
      return wkt;
    }

    return '';
  }

  getMapCoordinates(): string {
    const lon =
      this.data?.['acdh:hasLongitude']?.[this.mainId]?.[this.mainLang]?.[0]
        ?.value;
    const lat =
      this.data?.['acdh:hasLatitude']?.[this.mainId]?.[this.mainLang]?.[0]
        ?.value;

    const wkt =
      this.data?.['acdh:hasWKT']?.[this.mainId]?.[this.mainLang]?.[0]?.value;

    if (
      lon !== undefined &&
      lon !== null &&
      String(lon).trim() !== '' &&
      lat !== undefined &&
      lat !== null &&
      String(lat).trim() !== ''
    ) {
      return `[${lat}, ${lon}]`; // keep your original output order
    }
    if (wkt && String(wkt).trim() !== '') {
      // match: POINT(<first> <second>) – allow spaces, no commas
      const m = /POINT\(\s*([^\s,]+)\s+([^\s)]+)\s*\)/i.exec(String(wkt));
      if (m) {
        const first = m[1]; // usually lon
        const second = m[2]; // usually lat
        return `POINT(${second} ${first})`; // swap
      }
    }
    return '';
  }

  getSpatialCoordinates(): Array<string> {
    const spatial =
      this.data?.['acdh:hasSpatialCoverage']?.[this.mainId]?.[
        this.mainLang
      ]?.[0]?.value;

    if (spatial) {
      //we have to do a second api query to get the resource properties from the spatial id resource
    }

    /*
    if (isset($this->properties['acdh:hasSpatialCoverage'])) {
            $spatialId = isset($this->properties['acdh:hasSpatialCoverage'][0]['id']) ? $this->properties['acdh:hasSpatialCoverage'][0]['id'] : "";

            if (!empty($spatialId)) {
                $class = new \Drupal\arche_core_gui\Object\SpatialMapData();
                return $class->getData($this->getRepoBaseUrl().'/api/getCoordinates/' . $spatialId);
            }
        }
        return [];*/
    return [];
  }

  getBinarySize(): number {
    const category = this.getAcdhType()?.toLowerCase();
    if (
      category.includes('resource') ||
      category.includes('oldresource') ||
      category.includes('dataset')
    ) {
      const size =
        this.data?.['acdh:hasBinarySize']?.[this.mainId]?.[this.mainLang]?.[0]
          ?.value;
      return size;
    }

    return 0;
  }

  getAccessRestriction(): ResourceItem {
    const result: ResourceItem = {};

    if (this.data?.['acdh:hasAccessRestriction']) {
      const accessress = this.data?.['acdh:hasAccessRestriction'];
      for (const [k, v] of Object.entries(accessress)) {
        if (v[this.mainLang]) {
          result.id = v[this.mainLang].id;
          result.title = v[this.mainLang].value;
          result.accessrestriction = v[this.mainLang].value;
        } else {
          result.id = Object.keys(v)[0].id;
          result.title = Object.keys(v)[0].value;
          result.accessrestriction = Object.keys(v)[0].value;
        }
      }
    }
    return result;
  }

  getId(): string {
    return this.data.id;
  }
  getParentId(): string {
    if (this.data?.['acdh:isPartOf']) {
      return Object.keys(this.data?.['acdh:isPartOf'])[0];
    }
    return '';
  }

  getTitle(): string | null {
    const titleNode = this.properties['acdh:hasTitle'];

    const value = titleNode?.[0]?.value;
    if (value) return value;

    return 'Untitled';
  }

  getPersonalTitle(): string | null {
    const titleNode = this.properties['acdh:hasPersonalTitle'];

    const value = titleNode?.[0]?.value;
    if (value) return value;

    return '';
  }

  getAlternativeTitle(): string | null {
    const titleNode = this.properties['acdh:hasAlternativeTitle'];

    const value = titleNode?.[0]?.value;
    if (value) return value;

    return '';
  }

  getDataByProperty(property: string): any[] {
    const propData = this.properties?.[property];
    if (!propData) return [];

    // Get the "first" element (similar to PHP reset())
    const firstKey = Object.keys(propData)[0];
    const first = propData[firstKey];

    // If there's a value for the current language
    if (propData[this.language]) {
      return propData[this.language];
    }
    // Else, if there's a value for 'und'
    else if (propData['und']) {
      return propData['und'];
    }
    // Else, if the keys are integers, return the whole array
    else if (typeof firstKey === 'string' && !isNaN(Number(firstKey))) {
      return propData;
    }
    // Else, return the first element wrapped in an array
    else if (first !== undefined) {
      return Array.isArray(first) ? first : [first];
    }

    return [];
  }

  getAcdhType(): string | null {
    return this.properties['rdf:type']?.[0]?.value || '';
  }

  getAcdhCategoryVocabsId(): string | null {
    const categories = this.properties['acdh:hasCategory'];
    if (!Array.isArray(categories)) return null;
    for (const c of categories) {
      const identifiers = c.identifiers;
      for (const i of identifiers) {
        if (i.includes('/vocabs.acdh.oeaw')) {
          return i;
        }
      }
    }
    return '';
  }

  getAcdhCategory(): string | null {
    return this.properties['acdh:hasCategory']?.[0]?.value || '';
  }

  getFormat(): string | null {
    return this.properties['acdh:hasFormat']?.[0]?.value || '';
  }

  getAcdhTypeNiceFormat(): string | null {
    const full = this.getAcdhType();
    return full.replace('https://vocabs.acdh.oeaw.ac.at/schema#', '') || full;
  }

  getShortDescription(): string {
    return (
      this.properties['acdh:hasDescription']?.[0]?.value?.slice(0, 100) ||
      'No description'
    );
  }

  getAvailableDate(): string | null {
    const dateString =
      this.properties['acdh:hasAvailableDate']?.[0]?.value || '';
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return ''; // Invalid date check

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // JS months are 0-indexed
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  getPidOrAcdhIdentifier(): string | null {
    const pidValue =
      this.data?.['acdh:hasPid']?.[this.mainId]?.[this.mainLang]?.[0]?.value;
    const hasValidPid =
      pidValue &&
      (pidValue.includes('http://') || pidValue.includes('https://'));

    if (hasValidPid) {
      return pidValue;
    }
    const acdhID = this.getAcdhIdentifier();
    if (acdhID) {
      return acdhID;
    }

    const oneID = this.getOneID();
    if (oneID) {
      return oneID;
    }

    return null;
  }

  getAcdhIdentifier(): string | null {
    const identifiers = this.properties['acdh:hasIdentifier'];
    if (!Array.isArray(identifiers)) return null;

    for (const v of identifiers) {
      const value = v?.value;

      if (
        typeof value === 'string' &&
        value.includes('/id.acdh.oeaw.ac.at/') &&
        !value.includes('/id.acdh.oeaw.ac.at/cmdi/')
      ) {
        return value;
      }
    }

    return null;
  }

  getOneID(): string | null {
    const identifier =
      this.data?.['acdh:hasIdentifier']?.[this.mainId]?.[this.mainLang]?.[0]
        ?.value;

    if (!identifier) return null;

    return identifier;
  }

  getFundingLogos(): Array<string> {
    const logos = this.properties['acdh:hasFunderLogo'] || [];
    return logos;
    //data.getData('acdh:hasFunderLogo');
  }

  #fetchCardsData(props: Record<string, string>) {
    const result: Record<string, any[]> = {};

    for (const [k, v] of Object.entries(props)) {
      let bucket = this.properties?.[k];

      if (!bucket) continue;

      // Normalize to array
      if (!Array.isArray(bucket)) {
        bucket = [bucket];
      }
      for (const val of bucket) {
        if (
          val &&
          typeof val === 'object' &&
          'value' in val &&
          val.value != null
        ) {
          (result[v] ||= []).push(val);
        }
      }
    }
    return result;
  }

  #fetchBlocksData(props: Record<string, string>) {
    const result: Record<string, any[]> = {};

    for (const [k, v] of Object.entries(props)) {
      let bucket = this.properties?.[k];

      if (!bucket) continue;

      // Normalize to array
      if (!Array.isArray(bucket)) {
        bucket = [bucket];
      }
      for (const val of bucket) {
        if (
          val &&
          typeof val === 'object' &&
          'value' in val &&
          val.value != null
        ) {
          val.guiTitle = v;
          (result[k] ||= []).push(val);
        }
      }
    }
    return result;
  }

  getSizeData() {
    const props: Record<string, string> = {
      'acdh:hasExtent': 'Extent',
      'acdh:hasNumberOfItems': 'Number Of Items',
      'acdh:hasBinarySize': 'Binary Size',
    };
    return this.#fetchCardsData(props);
  }

  getProjectSummary(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasRelatedDiscipline': 'Research Discipline',
      'acdh:hasSubject': 'Subject',
      'acdh:hasSpatialCoverage': 'Spatial Coverage',
      'acdh:hasTemporalCoverage': 'Era',
      'acdh:hasCoverageStartDate': 'Coverage Date',
      'acdh:hasCoverageEndDate': 'Coverage Date',
      'acdh:hasAppliedMethod': 'Methods',
      'acdh:hasAppliedMethodDescription': 'Methods description',
      'acdh:hasCollectedStartDate': 'Data Collection Date',
      'acdh:hasCollectedEndDate': 'Data Collection Date',
      'acdh:hasDescription': 'Description',
      'acdh:hasNote': 'Note',
    };
    return this.#fetchBlocksData(props);
  }

  getPublicationSummary(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasAuthor': 'Author',
      'acdh:hasEditor': 'Editor',
      'acdh:hasSeriesInformation': 'Series Information',
      'acdh:hasExtent': 'Extent',
      'acdh:hasPages': 'Pages',
      'acdh:hasIssuedDate': 'Issued Date',
      'acdh:hasCity': 'City',
      'acdh:hasPublisher': 'Publisher',
      'acdh:hasUrl': 'URL',
      'acdh:hasLanguage': 'Language',
      'acdh:hasEditorialPractice': 'Editorial Practice',
      'acdh:hasTableOfContent': 'Table of content',
      'acdh:hasNote': 'Note',
    };
    return this.#fetchCardsData(props);
  }

  getPlaceAddress(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasAddressLine1': 'Address Line 1',
      'acdh:hasAddressLine2 ': 'Address Line 2',
      'acdh:hasPostcode': 'Postcode',
      'acdh:hasCity': 'City',
      'acdh:hasRegion': 'Region',
      'acdh:hasCountry': 'Country',
    };
    return this.#fetchCardsData(props);
  }

  getOrganisationAddressBlock(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasAddressLine1': 'Address Line 1',
      'acdh:hasAddressLine2 ': 'Address Line 2',
      'acdh:hasPostcode': 'Postcode',
      'acdh:hasCity': 'City',
      'acdh:hasRegion': 'Region',
      'acdh:hasCountry': 'Country',
      'acdh:hasEmail': 'Email',
      'acdh:hasUrl': 'URL',
    };
    return this.#fetchCardsData(props);
  }

  getOrganisationMemberBlock(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:isMemberOf': 'Member of',
    };
    return this.#fetchCardsData(props);
  }

  getMapCoordinatesBlock(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasLatitude': 'Latitude',
      'acdh:hasLongitude': 'Longitude',
      'acdh:hasWKT': 'WKT',
    };
    return this.#fetchCardsData(props);
  }

  getPlaceDescription(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasDescription': 'Description',
      'acdh:hasPart ': 'Part(s)',
      'acdh:isPartOf': 'Is part of',
    };
    return this.#fetchCardsData(props);
  }

  getArrangement() {
    if (this.getAcdhType()?.includes('TopCollection')) {
      const props: Record<string, string> = {
        'acdh:hasArrangement': 'Arrangement',
      };
      return this.#fetchBlocksData(props);
    }
  }

  getTechnicalData() {
    let props: Record<string, string> = {};
    const lower = this.getAcdhType()?.toLowerCase();

    if (lower?.includes('topcollection') || lower?.includes('collection')) {
      props = {
        'acdh:hasLifeCycleStatus': 'Life Cycle Status',
        'acdh:hasExtent': 'Extent',
        'acdh:hasNumberOfItems': 'Number Of Items',
        'acdh:hasBinarySize': 'Binary Size',
      };
    }

    if (lower?.includes('metadata') || lower?.includes('resource')) {
      props = {
        'acdh:hasCategory': 'Category',
        'acdh:hasFormat': 'File format',
        'acdh:hasBinarySize': 'File Size',
        'acdh:hasExtent': 'Extent',
      };
    }

    return this.#fetchCardsData(props);
  }

  getProjectDetailsData() {
    const props: Record<string, string> = {
      'acdh:hasStartDate': 'Project Start Date',
      'acdh:hasEndDate': 'Project End Date',
      'acdh:hasLifeCycleStatus': 'Life Cycle Status',
    };

    return this.#fetchCardsData(props);
  }

  getFundingData() {
    let props: Record<string, string> = {
      'acdh:hasFunder': 'Funder',
    };

    const lower = this.getAcdhType()?.toLowerCase();

    if (lower === 'topcollection' || lower === 'project') {
      props = {
        'acdh:hasFunder': 'Funder',
        'acdh:hasNonLinkedIdentifier': 'Project number',
      };
    }
    return this.#fetchCardsData(props);
  }

  getLicenseData() {
    const props: Record<string, string> = {
      'acdh:hasLicense': 'Licence',
      'acdh:hasLicenseSummary': 'Licence Summary',
      'acdh:hasAccessRestriction': 'Access Restriction',
      'acdh:hasAccessRestrictionSummary': 'Access Restriction Summary',
      'acdh:hasRightsInformation': 'Rights Information',
      'acdh:hasLicensor': 'Licensor',
      'acdh:hasOwner': 'Owner',
    };
    return this.#fetchCardsData(props);
  }

  getCreditsData() {
    const props: Record<string, string> = {
      'acdh:hasPrincipalInvestigator': 'Principal Investigator',
      'acdh:hasContact': 'Contact',
      'acdh:hasEditor': 'Editor',
      'acdh:hasAuthor': 'Author',
      'acdh:hasCreator': 'Creator',
      'acdh:hasContributor': 'In collaboration with',
      'acdh:hasDigitisingAgent': 'Digitised by',
    };

    return this.#fetchCardsData(props);
  }

  getSeeAlsoData() {
    const props: Record<string, string> = {
      'acdh:hasUrl': 'Url',
      'acdh:hasRelatedProject': 'Related Project',
    };

    return this.#fetchBlocksData(props);
  }

  getExpertTableData(): Record<string, any> {
    return this.properties;
  }

  getSummaryData(): Record<string, any> {
    const props: Record<string, string> = {
      'acdh:hasRelatedDiscipline': 'Research Discipline',
      'acdh:hasSubject': 'Subject',
      'acdh:hasSpatialCoverage': 'Spatial Coverage',
      'acdh:hasCoverageStartDate': 'Coverage Date - Start',
      'acdh:hasCoverageEndDate': 'Coverage Date - End',
      'acdh:hasCreatedStartDateOriginal': 'Creation Date of Original - Start',
      'acdh:hasCreatedEndDateOriginal': 'Creation Date of Original - Start',
      'acdh:hasDescription': 'Description',
      'acdh:hasNote': 'Note',
      'acdh:hasTemporalCoverage': 'Era',
    };
    return this.#fetchBlocksData(props);
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};

    const proto = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (name) =>
        typeof this[name] === 'function' &&
        name.startsWith('get') &&
        name !== 'get' && // avoid edge case
        name !== 'toJSON'
    );

    for (const name of methodNames) {
      const key = name
        .replace(/^get/, '') // remove "get"
        .replace(/^[A-Z]/, (c) => c.toLowerCase()); // lowercase first letter

      result[key] = this[name]();
    }

    return result;
  }
}
