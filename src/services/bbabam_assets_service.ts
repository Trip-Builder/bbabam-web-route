/* eslint-disable max-classes-per-file */
import axios from 'axios';

export interface PlaceImageCardData {
    english_title: string;
    url: string;
    korean_title: string;
    create_time: string;
    modified_time: string;
    month: string;
    location: string;
    keywords: string[];
}

class BBabamAssetsService {
    baseUrl = 'http://3.36.119.217:4828';
    // baseUrl = 'http://localhost:4828';

    async loadImages(): Promise<PlaceImageCardData[]> {
        const response = await axios.get<PlaceImageCardData[]>(
            `${this.baseUrl}/loadimage/20`
        );
        return response.data;
    }
}

export class FakeBBabamAssetsService extends BBabamAssetsService {
    // eslint-disable-next-line class-methods-use-this
    async loadImages(): Promise<PlaceImageCardData[]> {
        return [];
    }
}

export default BBabamAssetsService;
