/**
 * @author Brendan McGuire
 * @date 28 September 2021
 * 
 * Store for data from the sensor data API.
 */

import globalHook, { Store } from "use-global-hook";

export type Building = "WATT" | "COOPER" | "ASC" | "SIKES" | "FIKE";
export const BUILDINGS: Record<Building, string> = {
    WATT: "Watt Innovation Center",
    COOPER: "Cooper Library",
    ASC: "Academic Success Center",
    SIKES: "Sikes Hall",
    FIKE: "Fike Recreation Center",
};

export type Metric = "TEMP" | "HUMIDITY";
export const METRICS: Metric[] = ["TEMP", "HUMIDITY"];

export type APIResponse<T> = {
    status: "ok",
    data: T
} | {
    status: "err"
    error_message: string
}

export interface ResponseType {
    live: {
        PointSliceID: number;
        Alias: string;
        UTCDateTime: string;
        ETDateTime: string;
        ActualValue: number;
    }[],
    hist: {
        labels: number[],
        data: number[]
    },
    PXREF: {
        PointSliceID: string,
        Alias: string,
        in_xref: true
    }[],
    XREF: {
        PointSliceID: number,
        Room: string,
        RoomType: string,
        BLG: Building,
        Floor: string,
        ReadingType: string,
        Alias: string
    }[]
}

export interface RequestParameters {
    live: {
        building: Building,
        sensor: Metric
    },
    hist: {
        building: Building,
        sensor: Metric
        id: number,
    },
    XREF: {
        building: Building,
        sensor: Metric
    },
    PXREF: {
        building: Building,
        sensor: Metric
    }
}

// Use local endpoint if given, otherwise use the real server 
async function fetchAPI<T extends keyof ResponseType>(endpoint: T, parameters: RequestParameters[T]): Promise<ResponseType[T]> {

    // Serialize arguments
    let args: string[] = [];
    for (const [key, value] of Object.entries(parameters)) {
        args.push(encodeURIComponent(key) + "=" + encodeURIComponent(value))
    };

    let queryString = args.join("&");

    try {

        const response = await fetch(`/api/data/${endpoint}?${queryString}`);

        const json: APIResponse<ResponseType[T]> = await response.json();

        if (json.status == "ok") {
            return Promise.resolve(json.data);
        } else {
            return Promise.reject(json.error_message);
        }

    } catch (e) {
        return Promise.reject(e);
    }

}

export interface LoadedDataEntry<T> {
    loaded: true;
    fetched: number;
    data: T;
};

export interface UnloadedDataEntry {
    loaded: false;
    loading: boolean;
    error: string | undefined;
}


export type Entry<T extends keyof ResponseType> = LoadedDataEntry<ResponseType[T]> | UnloadedDataEntry;

// Store Types
export interface GlobalState {
    // In-Memory Cache of fetched data
    // EVENTUAL OPTIMIZATION: Save this to storage and hydrate onload

    live: {
        [B in Building]: {
            [M in Metric]: Entry<"live">;
        };
    };

    hist: {
        [B in Building]: {
            [M in Metric]: {
                [id: number]: Entry<"hist">;
            }
        };
    }

    XREF: {
        [B in Building]: {
            [M in Metric]: Entry<"XREF">;
        };
    }

    PXREF: {
        [B in Building]: {
            [M in Metric]: Entry<"PXREF">;
        };
    }

}

export interface GlobalActions {
    setPartialState: (state: Partial<GlobalState>) => void;
    ensureData<T extends keyof ResponseType>(
        endpoint: T,
        parameters: RequestParameters[T],
        maximumAge: number
    ): void;
    isLoadingData<T extends keyof ResponseType>(
        endpoint: T,
        parameters: RequestParameters[T]): void;
    updateEntry<T extends keyof ResponseType>(
        endpoint: T,
        parameters: RequestParameters[T],
        entry: Entry<T>
    ): void;
    hydrate: () => void;
}


function setPartialState(
    store: Store<GlobalState, GlobalActions>,
    state: Partial<GlobalState>
) {
    store.setState({ ...store.state, ...state });
}

function accessEntry<T extends keyof ResponseType>(store: Store<GlobalState, GlobalActions>, endpoint: T,
    parameters: RequestParameters[T]): Entry<T> {

    if (endpoint === "live" || endpoint === "PXREF" || endpoint === "XREF") {
        return store.state.live[parameters.building][parameters.sensor] as Entry<T>;
    } else {
        const params = parameters as RequestParameters["hist"]; // Required cast because typescript cannot determine the narrowing here
        return store.state.hist[params.building][params.sensor][params.id] as Entry<T>;
    }
};

function updateEntry<T extends keyof ResponseType>(
    store: Store<GlobalState, GlobalActions>,
    endpoint: T,
    parameters: RequestParameters[T],
    entry: Entry<T>
) {

    switch (endpoint) {
        case "live": {
            store.actions.setPartialState({
                live: {
                    ...store.state.live, [parameters.building]: {
                        ...store.state.live[parameters.building],
                        [parameters.sensor]: entry
                    }
                }
            });
            break;
        }

        case "XREF": {
            store.actions.setPartialState({
                XREF: {
                    ...store.state.XREF, [parameters.building]: {
                        ...store.state.XREF[parameters.building],
                        [parameters.sensor]: entry
                    }
                }
            });
            break;
        }

        case "PXREF": {
            store.actions.setPartialState({
                PXREF: {
                    ...store.state.PXREF, [parameters.building]: {
                        ...store.state.PXREF[parameters.building],
                        [parameters.sensor]: entry
                    }
                }
            });
            break;
        }

        case "hist": {
            const param = parameters as RequestParameters["hist"]; // Required cast because typescript cannot determine the narrowing here
            store.actions.setPartialState({
                hist: {
                    ...store.state.hist, [param.building]: {
                        ...store.state.hist[param.building],
                        [param.sensor]: {
                            ...store.state.hist[param.building][param.sensor],
                            [param.id]: entry
                        }
                    }
                }
            });
            break;
        }

    }

    localStorage.setItem("data", JSON.stringify(store.state));
}


function isLoadingData<T extends keyof ResponseType>(
    store: Store<GlobalState, GlobalActions>,
    endpoint: T,
    parameters: RequestParameters[T]
) {
    const entry = accessEntry(store, endpoint, parameters);

    if (entry.loaded) {
        return false;
    } else {
        return (entry as UnloadedDataEntry).loading;
    }
}

async function ensureData<T extends keyof ResponseType>(
    store: Store<GlobalState, GlobalActions>,
    endpoint: T,
    parameters: RequestParameters[T],
    maximumAge: number
) {

    // Short path, if data was fetched within maximumAge ms, immediately return
    const entry = accessEntry(store, endpoint, parameters);

    if (entry.loaded && (Date.now() - entry.fetched) < maximumAge) {
        return;
    }

    store.actions.updateEntry(endpoint, parameters, {
        loaded: false,
        loading: true,
        error: undefined,
    });

    try {
        const data = await fetchAPI(endpoint, parameters);
        store.actions.updateEntry(endpoint, parameters, {
            loaded: true,
            fetched: Date.now(),
            data,
        });
    } catch (e) {
        store.actions.updateEntry(endpoint, parameters, {
            loaded: false,
            loading: false,
            error: `${e}`,
        });
    }
}


const actions = {
    setPartialState,
    isLoadingData,
    updateEntry,
    ensureData,
};

// Initial State
let initialState: GlobalState = {
    live: {
        WATT: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        COOPER: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        ASC: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        FIKE: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        SIKES: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
    },
    hist: {
        WATT: {
            TEMP: {

            },
            HUMIDITY: {

            },
        },
        COOPER: {
            TEMP: {

            },
            HUMIDITY: {

            },
        },
        ASC: {
            TEMP: {

            },
            HUMIDITY: {

            },
        },
        FIKE: {
            TEMP: {

            },
            HUMIDITY: {

            },
        },
        SIKES: {
            TEMP: {

            },
            HUMIDITY: {

            },
        },
    },
    XREF: {
        WATT: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        COOPER: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        ASC: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        FIKE: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        SIKES: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
    },
    PXREF: {
        WATT: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        COOPER: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        ASC: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        FIKE: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
        SIKES: {
            TEMP: {
                loaded: false,
                loading: false,
                error: undefined,
            },
            HUMIDITY: {
                loaded: false,
                loading: false,
                error: undefined,
            },
        },
    },
};

if (process.browser && localStorage.getItem("data")) {
    initialState = JSON.parse(localStorage.getItem("data"));
};

const useGlobal = globalHook<GlobalState, GlobalActions>(
    initialState,
    actions
);

export default useGlobal;
