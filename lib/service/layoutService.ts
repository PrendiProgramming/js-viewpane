import withObservable from "../common/withObservable";
import debounceUpdateListener from "../common/debounceUpdateListener";


const layoutService = withObservable.call({

    EVENT_START: "start",
    EVENT_UPDATE: "update",
    EVENT_END: "end",

    viewportSize: { x: 0, y: 0 },

    updateViewportSize: function () {
        this.viewportSize.x = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        this.viewportSize.y = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        return this.viewportSize;
    },

    getViewportSize: function () {
        return this.viewportSize;
    }
});

window.addEventListener("resize", debounceUpdateListener({

	"timeout": 500,
	"debounce": 250,

	start: function () {
		layoutService.notify(layoutService.EVENT_START, layoutService.updateViewportSize());
	},
	update: function () {
		layoutService.notify(layoutService.EVENT_UPDATE, layoutService.updateViewportSize());
	},
	end: function () {
		layoutService.notify(layoutService.EVENT_END, layoutService.updateViewportSize());
	}
}));

// ! possible duplicate with resize...
window.addEventListener("orientationchange", function () {
    const vpSize = layoutService.updateViewportSize();

    // call start async, given browser repaint some time
    setTimeout(function () {
        layoutService.notify(layoutService.EVENT_START, vpSize);

        // call end asnyc
        setTimeout(function () {
            layoutService.notify(layoutService.EVENT_END, vpSize);
        }, 1);
    }, 100);
});

layoutService.updateViewportSize();


export default layoutService;

