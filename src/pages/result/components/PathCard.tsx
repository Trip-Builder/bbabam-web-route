import { styled } from 'styled-components';
import { observer } from 'mobx-react-lite';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';
import ContentArea from '../../../components/ContentArea';
import { useBBabamFlow } from '../../../hooks/bbabam_flow_provider';

import Spinner from '../../../components/Spinner';

import NoResultIcon from '../../../assets/svg/no_result_icon.svg';
import {
    PathData,
    PathStep,
    PathTravelMode,
} from '../../../services/bbabam_flow_listener';

import WalkIcon from '../../../assets/svg/walk_icon.svg';
import BusIcon from '../../../assets/svg/bus_icon.svg';
import DepartureIcon from '../../../assets/svg/departure_icon.svg';
import ArriveIcon from '../../../assets/svg/arrive_icon.svg';

const PathCardContainer = styled.div`
    width: 100%;
    height: 670px;
    box-sizing: border-box;
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
    padding: 24px;
    padding-top: 36px;

    border-radius: 8px;
    border: 1px solid #e7e7e7;
    background: #fff;
    box-shadow: 0px 4px 8px 2px rgba(0, 0, 0, 0.04);
`;

const PathCardTitle = styled.div`
    color: #000080;
    font-family: Nunito Sans;
    font-size: 24px;
    font-style: normal;
    font-weight: 900;
    line-height: normal;

    margin-bottom: 28px;
`;

const LoadingPathCardContainer = styled.div`
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

const PathCardContentContainer = styled.div`
    width: 100%;
    flex: 1;
    min-height: 0;

    display: flex;
    flex-direction: row;
    gap: 8px;
`;

const PathCardListContainer = styled.div`
    flex: 2;
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    gap: 14px;

    padding-bottom: 14px;
`;

const PathCardMapContainer = styled.div`
    flex: 2;
    height: 100%;
`;

const PathStepItemContainer = styled.div<{
    isStart?: boolean;
    isEnd?: boolean;
    isWalking?: boolean;
    isSelected?: boolean;
}>`
    width: 100%;
    padding: 28px 31px;

    display: flex;
    flex-direction: row;
    align-items: center;
    box-sizing: border-box;

    border-radius: 8px;
    border: 1px solid #d2d2d2;

    transition:
        background 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out,
        scale 0.2s ease-in-out;

    background: ${(props) => {
        if (props.isStart || props.isEnd) return '#D2D2D208';
        if (props.isWalking) return '#05CFD208';
        return '#05D27C08';
    }};

    border-color: ${(props) => {
        if (props.isStart || props.isEnd) return '#D2D2D2';
        if (props.isWalking) return '#05CFD2';
        return '#05D27C';
    }};

    &:hover {
        background: ${(props) => {
            if (props.isStart || props.isEnd) return '#D2D2D21A';
            if (props.isWalking) return '#05CFD21A';
            return '#05D27C1A';
        }};

        box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.06);
    }

    &:active {
        scale: 0.95;
    }

    cursor: pointer;

    & > img {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    & > .explanation {
        flex: 1;
        margin-left: 22px;

        display: flex;
        flex-direction: column;
        gap: 4px;

        & > .title {
            color: #000;
            font-family: Nunito Sans;
            font-size: 14px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
        }

        & > .description {
            color: #7e7e7e;
            font-family: Nunito Sans;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
    }
`;

function DepartureItem({ onClick }: { onClick: () => void }) {
    return (
        <PathStepItemContainer
            isStart
            onClick={() => {
                onClick();
            }}
        >
            <img src={DepartureIcon} alt="travel mode icon" />
            <div className="explanation">
                <div className="title">Departure</div>
            </div>
        </PathStepItemContainer>
    );
}

function ArriveItem({ onClick }: { onClick: () => void }) {
    return (
        <PathStepItemContainer
            isEnd
            onClick={() => {
                onClick();
            }}
        >
            <img src={ArriveIcon} alt="travel mode icon" />
            <div className="explanation">
                <div className="title">Arrive</div>
            </div>
        </PathStepItemContainer>
    );
}

function PathStepItem({
    pathStep,
    onClick,
}: {
    pathStep: PathStep;
    onClick: (pathStep: PathStep) => void;
}) {
    return (
        <PathStepItemContainer
            isWalking={pathStep.travelMode === PathTravelMode.walking}
            onClick={() => {
                onClick(pathStep);
            }}
        >
            <img
                src={
                    pathStep.travelMode === PathTravelMode.walking
                        ? WalkIcon
                        : BusIcon
                }
                alt="travel mode icon"
            />
            <div className="explanation">
                <div className="title">{pathStep.instructions}</div>
                <div className="description">
                    {`${pathStep.duration.text}, ${pathStep.distance.text}`}
                </div>
            </div>
        </PathStepItemContainer>
    );
}

function getAllMarks(pathData: PathData) {
    const result = [];
    result.push(
        <MarkerF
            position={{
                lat: pathData.startLocation.lat,
                lng: pathData.startLocation.lon,
            }}
        />
    );

    for (let i = 0; i < pathData.steps.length; i += 1) {
        const poi = pathData.steps[i];
        result.push(
            <MarkerF
                position={{
                    lat: +poi.endLocation.lat,
                    lng: +poi.endLocation.lon,
                }}
            />
        );
    }
    return result;
}

function PathCard() {
    const bbabamFlowStore = useBBabamFlow();
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: 'AIzaSyAM62j-Hds1-Rx4zqXrkdsNJH8O7O-SR6M',
    });
    const mapRef = useRef<GoogleMap>(null);
    const [currentCenter, setCurrentCenter] = useState<{
        lat: number;
        lng: number;
    }>({
        lat: 0,
        lng: 0,
    });

    useEffect(() => {
        if (bbabamFlowStore.pathData.length > 0) {
            setCurrentCenter({
                lat: +bbabamFlowStore.pathData[0].startLocation.lat,
                lng: +bbabamFlowStore.pathData[0].startLocation.lon,
            });
        }
    }, [bbabamFlowStore.pathData]);

    if (
        bbabamFlowStore.pathGenerated &&
        bbabamFlowStore.pathData.length > 0 &&
        isLoaded
    ) {
        return (
            <ContentArea>
                <PathCardContainer>
                    <PathCardTitle>🧭 Path Information</PathCardTitle>
                    <PathCardContentContainer>
                        <PathCardListContainer>
                            <DepartureItem
                                onClick={() => {
                                    setCurrentCenter({
                                        lat: +bbabamFlowStore.pathData[0]
                                            .startLocation.lat,
                                        lng: +bbabamFlowStore.pathData[0]
                                            .startLocation.lon,
                                    });
                                }}
                            />
                            {bbabamFlowStore.pathData[0].steps.map(
                                (pathStep) => (
                                    <PathStepItem
                                        key={pathStep.indexFrom}
                                        pathStep={pathStep}
                                        onClick={(step) => {
                                            setCurrentCenter({
                                                lat: +step.endLocation.lat,
                                                lng: +step.endLocation.lon,
                                            });
                                        }}
                                    />
                                )
                            )}
                            <ArriveItem
                                onClick={() => {
                                    setCurrentCenter({
                                        lat: +bbabamFlowStore.pathData[0]
                                            .endLocation.lat,
                                        lng: +bbabamFlowStore.pathData[0]
                                            .endLocation.lon,
                                    });
                                }}
                            />
                        </PathCardListContainer>
                        <PathCardMapContainer>
                            <GoogleMap
                                ref={mapRef}
                                mapContainerStyle={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px',
                                    border: '1px solid #e7e7e7',
                                    boxSizing: 'border-box',
                                }}
                                zoom={16}
                                center={currentCenter}
                                options={{
                                    disableDefaultUI: true,
                                }}
                            >
                                {getAllMarks(bbabamFlowStore.pathData[0])}
                            </GoogleMap>
                        </PathCardMapContainer>
                    </PathCardContentContainer>
                </PathCardContainer>
            </ContentArea>
        );
    }

    if (!bbabamFlowStore.pathGenerated || !isLoaded) {
        return (
            <ContentArea>
                <LoadingPathCardContainer>
                    <Spinner size={18} thickness={3} color="#000080" />
                    <div>Gernerating Path INFORMATIONS</div>
                </LoadingPathCardContainer>
            </ContentArea>
        );
    }

    return (
        <ContentArea>
            <LoadingPathCardContainer>
                <img src={NoResultIcon} alt="no result" />
                <div>No Path INFORMATIONS</div>
            </LoadingPathCardContainer>
        </ContentArea>
    );
}

export default observer(PathCard);
