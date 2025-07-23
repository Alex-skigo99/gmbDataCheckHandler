import axios from "axios";
import layerUtils from "/opt/nodejs/utils/layerUtils.js";

const getAutocompleteUrl = (address, apiKey) => {
    return `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${apiKey}`;
};

export const getGoogleAutocompleteAddressResponse = async (address) => {
    const apiKey = await layerUtils.getGoogleMapsApiKey();
    const googleApiResponse = await axios.get(getAutocompleteUrl(address, apiKey));

    return googleApiResponse;
};
