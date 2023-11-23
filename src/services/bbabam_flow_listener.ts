import { io, Socket } from 'socket.io-client';

export interface POIData {
    name: string;
    address: string;
    loc_X: number;
    loc_Y: number;
    url: string;
    cate1: string;
    cate2: string;
    callnum: string;
}

export interface AssociatedKeyword {
    keyword: string;
    queries: string[];
}

export interface PathTupleValue {
    text: string;
    value: number;
}

export interface PathLocation {
    lat: number;
    lon: number;
}

export enum PathTravelMode {
    walking,
    transit,
}

export interface PathStep {
    indexFrom: number;
    indexTo: number;
    distance: PathTupleValue;
    duration: PathTupleValue;
    startLocation: PathLocation;
    endLocation: PathLocation;
    instructions: string;
    travelMode: PathTravelMode;
}
export interface PathData {
    totalDistance: PathTupleValue;
    totalDuration: PathTupleValue;
    startLocation: PathLocation;
    endLocation: PathLocation;
    steps: PathStep[];
}

abstract class BBabamFlowServiceListener {
    socket: Socket;

    resultCount = 0;

    constructor() {
       	this.socket = io('https://bbabam-apis.tripbuilder.co.kr/search', 
	{
            // this.socket = io('http://localhost:4828/search', {
            autoConnect: false,
        });
        this.socket.connect();

        this.socket.on('start_crawling', (data) => {
            this.onStartCrawling(data.search_keywords);
        });
        this.socket.on('error', () => {
            this.onError(0);
        });
        this.socket.on('finish_crawling', (data) => {
            this.onFinishCrawling(data.search_keyword);
        });
        this.socket.on('start_generation', (data) => {
            this.onUrlGeneration(data.urls);
        });

        this.socket.on('generation', (data) => {
            this.resultCount += 1;
            if (this.resultCount === 4) {
                // stream 방식으로 불러오기때문에 주석처리
                // this.socket.disconnect();
            }
            const { word } = data;
            this.onResultGeneration(word);
        });

        this.socket.on('end_generation', (data) => {
            console.log('done!', data);
        });

        this.socket.on('poi_generation', (data) => {
            this.resultCount += 1;
            if (this.resultCount === 4) {
                // this.socket.disconnect();
            }
            this.onPoiGeneration(data.place_keywords, data.place_crawled_data);
        });
        this.socket.on('path_generation', (data) => {
            this.resultCount += 1;
            if (this.resultCount === 4) {
                // this.socket.disconnect();
            }
            const pathData: PathData[] = data.path_crawled_data.map(
                (path: any) => ({
                    totalDistance: path['Total distance'],
                    totalDuration: path['Total duration'],
                    startLocation: {
                        lat: parseFloat(path.Startpoint.lat),
                        lon: parseFloat(path.Startpoint.lon),
                    },
                    endLocation: {
                        lat: parseFloat(path.Endpoint.lat),
                        lon: parseFloat(path.Endpoint.lon),
                    },
                    steps: path.Steps.map((step: any) => ({
                        indexFrom: parseInt(
                            step.index.split('to')[0].trim(),
                            10
                        ),
                        indexTo: parseInt(step.index.split('to')[1].trim(), 10),
                        distance: step.distance,
                        duration: step.duration,
                        startLocation: {
                            lat: step.start_location.lat,
                            lon: step.start_location.lng,
                        },
                        endLocation: {
                            lat: step.end_location.lat,
                            lon: step.end_location.lng,
                        },
                        instructions: step.html_instructions,
                        travelMode:
                            step.travel_mode === 'WALKING'
                                ? PathTravelMode.walking
                                : PathTravelMode.transit,
                    })),
                })
            );

            this.onPathGeneration(data.path_keywords, pathData);
        });
        this.socket.on('associated_ketwords', (data) => {
            this.resultCount += 1;
            if (this.resultCount === 4) {
                // this.socket.disconnect();
            }
            // data.associated_keywords is like this:
            /*
            {
                
                "associated_keywords": [
                    {
                        "Ulsan": [
                            "What are the tourist attractions in Ulsan?",
                            "How can I get to Ulsan from Seoul?",
                            "What is the weather like in Ulsan?"
                        ]
                    },
                ]
            }
            */

            // convert data.associated_keywords to AssociatedKeyword[]
            /*
            [
                {
                    keyword: "Ulsan",
                    queries: [
                        "What are the tourist attractions in Ulsan?",
                        "How can I get to Ulsan from Seoul?",
                        "What is the weather like in Ulsan?"
                    ]
                },
            ]
            */

            const associatedKeywords: AssociatedKeyword[] = [];
            // Traverse the array
            // eslint-disable-next-line no-restricted-syntax
            for (const obj of data.associated_keywords) {
                // Traverse each object in the array
                // eslint-disable-next-line no-restricted-syntax
                for (const [key, value] of Object.entries(obj)) {
                    // Push a new object to the associatedKeywords array
                    associatedKeywords.push({
                        keyword: key,
                        queries: value as string[],
                    });
                }
            }

            // write code here
            this.onAssociatedKeywordsGeneration(associatedKeywords);
        });
    }

    startFlow(message: string) {
        this.resultCount = 0;
        this.socket.emit('start', { search_text: message });
    }

    abstract onStartCrawling(searchKeywords: string[]): void;
    abstract onError(errorCode: number): void;
    abstract onFinishCrawling(searchKeyword: string): void;
    abstract onUrlGeneration(urls: string[]): void;
    abstract onResultGeneration(result: string): void;
    abstract onPoiGeneration(
        placeKeywords: string[],
        placeCrawledData: POIData[]
    ): void;
    abstract onPathGeneration(
        pathKeywords: string[],
        pathCrawledData: PathData[]
    ): void;
    abstract onAssociatedKeywordsGeneration(
        associatedKeywords: AssociatedKeyword[]
    ): void;
}

export { BBabamFlowServiceListener };
