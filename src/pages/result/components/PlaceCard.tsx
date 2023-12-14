import { observer } from 'mobx-react-lite';
import { styled } from 'styled-components';
import { useRef } from 'react';

import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import { animated, useSprings } from '@react-spring/web';
import ContentArea, {
    ContentAreaPadding,
    ContentAreaWidth,
} from '../../../components/ContentArea';
import useClientWidthHeight from '../../../hooks/use_client_width_height';
import { useBBabamFlow } from '../../../hooks/bbabam_flow_provider';
import { POIData } from '../../../services/bbabam_flow_listener';
import Spinner from '../../../components/Spinner';

import NoResultIcon from '../../../assets/svg/no_result_icon.svg';

const PlaceCardContainer = styled.div`
    width: 100%;
    height: 600px;

    box-sizing: border-box;

    padding: 46px 0;
    padding-bottom: 0;
    flex-shrink: 0;

    border: 1px solid #e7e7e7;
    background: #fcfcfc;

    display: flex;
    flex-direction: column;
`;

const TitleContainer = styled.div`
    color: #000080;
    font-family: Nunito Sans;
    font-size: 24px;
    font-style: normal;
    font-weight: 900;
    line-height: normal;
    margin-bottom: 12px;
`;

const POICardListContainer = styled.div<{
    leftPadding: number;
}>`
    flex: 1;
    width: 100%;
    box-sizing: border-box;

    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 36px;
    padding-bottom: 46px;
    padding-right: 20px;

    overflow-x: auto;
    overflow-y: hidden;
    padding-left: ${(props) => props.leftPadding}px;
`;

const POICardRankContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;

    & > div:first-child {
        position: relative;
        bottom: -20px;
        color: #f2f2f2;
        font-family: Pretendard;
        font-size: 100px;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
    }

    & > div:last-child {
        position: relative;
        left: -12px;
    }
`;

const POICardConatiner = styled.div`
    width: 357px;
    height: 413px;
    position: relative;
    flex-shrink: 0;

    box-sizing: border-box;

    border-radius: 8px;
    border: 1px solid #e7e7e7;
    background: #fff;
    box-shadow: 0px 4px 8px 2px rgba(0, 0, 0, 0.04);

    display: flex;
    flex-direction: column;

    & > .title {
        width: 100%;
        box-sizing: border-box;
        height: 46px;

        border-radius: 8px 8px 0px 0px;
        border-bottom: 1px solid #d5d5d5;
        background: #fcfcfc;

        padding: 4px 20px;

        display: flex;
        flex-direction: row;
        align-items: center;

        color: #000;
        font-family: Pretendard;
        font-size: 16px;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
    }
`;

const POICardContentContainer = styled.div`
    width: 100%;
    flex: 1;
    box-sizing: border-box;

    padding: 26px 20px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;

    color: #000;
    font-family: Pretendard;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;

    overflow-y: auto;
`;

const LoadingPlaceCardContainer = styled.div`
    width: 100%;
    height: 80px;

    box-sizing: border-box;
    padding: 0 39px;

    border-radius: 8px;
    border: 1px solid #e7e7e7;
    background: #fcfcfc;

    display: flex;
    flex-direction: row;
    align-items: center;

    & > img {
        width: 22px;
        height: 22px;
    }

    & > div:last-child {
        flex: 1;
        color: #000080;
        font-family: Nunito Sans;
        font-size: 18px;
        font-style: normal;
        font-weight: 800;
        line-height: normal;

        margin-left: 22px;
    }
`;

function POICard({ poiData, index }: { poiData: POIData; index: number }) {
    const locX = poiData.loc_X;
    const locY = poiData.loc_Y;

    return (
        <POICardRankContainer>
            <div>{index + 1}</div>
            <POICardConatiner>
                <div className="title">{poiData.name}</div>
                <GoogleMap
                    mapContainerStyle={{
                        width: '100%',
                        height: '201px',
                    }}
                    zoom={16}
                    center={{
                        lat: +locY,
                        lng: +locX,
                    }}
                    options={{
                        disableDefaultUI: true,
                    }}
                >
                    <MarkerF
                        position={{
                            lat: +locY,
                            lng: +locX,
                        }}
                    />
                </GoogleMap>
                <POICardContentContainer>
                    {poiData.callnum && <div>📞 {poiData.callnum}</div>}
                    {poiData.address && <div>📍 {poiData.address}</div>}
                    {poiData.url && <div>🌐 {poiData.url}</div>}
                </POICardContentContainer>
            </POICardConatiner>
        </POICardRankContainer>
    );
}

function PlaceCard() {
    const bbabamFlowStore = useBBabamFlow();

    const containerRef = useRef<HTMLDivElement>(null);
    const { width } = useClientWidthHeight(containerRef, [
        bbabamFlowStore.poiGenerated,
    ]);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: 'AIzaSyAM62j-Hds1-Rx4zqXrkdsNJH8O7O-SR6M',
    });

    const [appearAnimation] = useSprings(
        bbabamFlowStore.poiData.length,
        (index) => ({
            from: {
                opacity: 0,
                transform: 'translateY(20px)',
            },
            to: {
                opacity: 1,
                transform: 'translateY(0px)',
            },
            delay: 200 + index * 100,
        }),
        []
    );

    if (
        bbabamFlowStore.poiGenerated &&
        isLoaded &&
        bbabamFlowStore.poiData.length > 0
    ) {
        return (
            <PlaceCardContainer ref={containerRef}>
                <ContentArea>
                    <TitleContainer>🗺️ PLACE INFORMATIONS</TitleContainer>
                </ContentArea>
                <POICardListContainer
                    leftPadding={Math.max(
                        ContentAreaPadding,
                        (width - ContentAreaWidth) / 2 - 10
                    )}
                >
                    {bbabamFlowStore.poiData.map((poi, index) => (
                        <animated.div style={appearAnimation[index]}>
                            <POICard poiData={poi} index={index} />
                        </animated.div>
                    ))}
                </POICardListContainer>
            </PlaceCardContainer>
        );
    }
    if (!bbabamFlowStore.poiGenerated || !isLoaded) {
        return (
            <ContentArea>
                <LoadingPlaceCardContainer>
                    <Spinner size={18} thickness={3} color="#000080" />
                    <div>Gernerating PLACE INFORMATIONS</div>
                </LoadingPlaceCardContainer>
            </ContentArea>
        );
    }

    return (
        <ContentArea>
            <LoadingPlaceCardContainer>
                <img src={NoResultIcon} alt="no result" />
                <div>No PLACE INFORMATIONS</div>
            </LoadingPlaceCardContainer>
        </ContentArea>
    );
}

export default observer(PlaceCard);
