
import {connect} from "react-redux";
import getOr from "lodash/fp/getOr";
import updateIn from "lodash/fp/update";
import merge from "lodash/fp/merge";
import mapValues from "lodash/fp/mapValues";
import updateObject from "updeep";
const mapValuesWithKey = mapValues.convert({cap: false});


const plain = {};
const justEmpty = () => plain;
const getDefault = getOr(plain);
const pass = o => o;
const withSlash = s => s ? ("/" + s) : "";


export function connectLean(options=plain) {

    // If we have scope and no picker just pick everything from the scope
    if (!options.mapState && options.scope) {
        options = {...options, mapState: pass};
    }

    // Never pass full state to the component
    if (!options.mapState && !options.scope) {
        options = {...options, mapState: justEmpty};
    }

    const withDefaults = options.defaults ? merge(options.defaults) : pass;

    var connector = connect(
        fullState => {
            var state = getDefault(options.scope, fullState);
            return options.mapState(withDefaults(state));
        },
        dispatch => {

            const bindDispatch = (updateFn, name) => (...args) => {
                dispatch({
                    type: "LEAN_UPDATE" + withSlash(options.scope) + withSlash(name),
                    update: updateFn(...args),
                    withDefaults,
                    scope: options.scope,
                });
            };

            return mapValuesWithKey(bindDispatch, options.updates);
        }
    );

    if (options.scope) {
        connector.displayName  = options.scope;
    }
    return connector;
}

const actionPattern = /^LEAN_UPDATE/;

export default function leanReducer(state, action) {
    if (!actionPattern.test(action.type)) {
        return state;
    }
    const {scope, update, withDefaults} = action;

    if (scope) {
        return updateIn(scope, s => updateObject(update, withDefaults(s)), state);
    }

    return updateObject(action.update, withDefaults(state));
}
