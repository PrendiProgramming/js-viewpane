import Viewpane, { vector } from "../lib";
// @ts-ignore
import city from "./city.jpg";
console.log(city);

var camElem = document.getElementById("js-fit-largest-camera");
var viewpaneElem = document.getElementById("js-fit-largest-viewpane");
viewpaneElem.style.background = `url('${city}') no-repeat`;

var viewpane = new Viewpane(camElem, viewpaneElem, {});
viewpane.setPosition(vector.create(-690, -530, -5000));
viewpane.repaint();

var camfitElem = document.getElementById("js-fit-both-camera");
var viewpaneFitElem = document.getElementById("js-fit-both-viewpane");
viewpaneFitElem.style.background = `url('${city}') no-repeat`;

var viewpane2 = new Viewpane(camfitElem, viewpaneFitElem, {
    // typeOfFocus: "fitBothDimensions"
});
viewpane2.setPosition(vector.create(-690, -330, -1000));
viewpane2.repaint();
