import { observable, computed } from 'mobx';
import axios from 'axios';

export class AppState {

    @observable
    zoomLevel: number = 1;

    @observable
    popupAnchorElement?: Element;

    @observable
    filterText: string = "";

    @computed
    get inProgress(): boolean { return this._inProgress; };

    @computed
    get selectedProducts(): IProduct[] { return this._selectedProducts };

    @computed
    get nodes(): INode[] { return this._nodes; }
    @computed
    get links(): ILink[] { return this._links; }

    load() {

        if (this._inProgress) {
            return;
        }
        this._inProgress = true;

        this._nodes = [];
        this._links = [];

        this.getProducts().then(products => {

            const nodes: INode[] = [];
            const links: ILink[] = [];

            for (var product of products) {

                const keywords = this.getKeywordsFromTitle(product.title);

                if (keywords.length === 1) {

                    // Adding product as a node (since the graph component is unable to show self-referencing links)
                    nodes.push({ id: product.title, size: 200, color: 'lightgrey' });
                    links.push({ source: product.title, target: product.title, label: product.title })
                    
                    this.addProductToMap(product.title, product);

                } else {

                    var prevKeyword = '';
                    for (var keyword of keywords) {

                        // eslint-disable-next-line
                        const node = nodes.find(n => n.id === keyword);
                        if (!node) {
                            nodes.push({ id: keyword, size: 200 });
                        } else {
                            node.size += 200;
                        }

                        if (!!prevKeyword) {
                            // eslint-disable-next-line
                            const link = links.find(l =>
                                (l.source === prevKeyword && l.target === keyword) ||
                                (l.target === prevKeyword && l.source === keyword)
                            );

                            if (!link) {
                                links.push({ source: prevKeyword, target: keyword, label: product.title })
                            }
                        }
                        prevKeyword = keyword;

                        this.addProductToMap(keyword, product);
                    }
                }

            }

            this._nodes = nodes;
            this._links = links;

        }).finally(() => {
            this._inProgress = false;
        });
    }

    onNodeSelected(keyword: string): void {

        if (!!this._productsMap[keyword]) {

            this._selectedProducts = this._productsMap[keyword]
                .filter((p1, index, self) => self.findIndex(p2 => p2.title === p1.title) === index);

        } else {

            this._selectedProducts = [];
        }

        const nodeElements = document.querySelectorAll(`[id="${keyword}"]`);
        if (nodeElements.length > 0) {
            this.popupAnchorElement = nodeElements[0];
        }

        // Automatically hiding menu after N sec.
        setTimeout(() => { this.popupAnchorElement = undefined }, PopupTimeout);
    }

    onLinkSelected(keyword1: string, keyword2: string): void {

        // Taking an intersection of products
        const products1 = this._productsMap[keyword1] ?? [];
        const products2 = this._productsMap[keyword2] ?? [];
        const selectedProducts = products1
            .filter(p1 => products2.some(p2 => p2.title === p1.title))
            .filter((p1, index, self) => self.findIndex(p2 => p2.title === p1.title) === index);

        this._selectedProducts = selectedProducts;
        if (selectedProducts.length <= 0) {
            return;
        }

        var linkElements = document.querySelectorAll(`[href="#${keyword1},${keyword2}"]`);
        if (linkElements.length > 0) {
            this.popupAnchorElement = linkElements[0];
        } else {

            linkElements = document.querySelectorAll(`[href="#${keyword2},${keyword1}"]`);
            if (linkElements.length > 0) {
                this.popupAnchorElement = linkElements[0];
            }
        }

        // Automatically hiding menu after N sec.
        setTimeout(() => { this.popupAnchorElement = undefined }, PopupTimeout);
    }

    onProductSelected(product: IProduct): void {

        window.open(`https://azure.microsoft.com${product.url}`, '_blank');
    }

    @observable
    private _nodes: INode[] = [];
    @observable
    private _links: ILink[] = [];
    @observable
    private _selectedProducts: IProduct[] = [];
    @observable
    private _inProgress: boolean;

    private _productsMap: { [keyword: string]: IProduct[] } = {};

    private addProductToMap(keyword: string, product: IProduct) {

        if (!this._productsMap[keyword]) {
            this._productsMap[keyword] = [];
        }
        this._productsMap[keyword].push(product);
    }

    private getProducts(): Promise<IProduct[]>{

        return axios.get(`${process.env.REACT_APP_BACKEND_BASE_URI}/services-html`).then(response => {

            const html = response.data;

            const regex = /<a href="(\/[^"]+)" data-event="area-products-index-clicked-product" data-event-property="([^"]+)">/gi;

            const filterText = this.filterText.toLowerCase();
            const result: { url: string, title: string }[] = [];
            var match: RegExpExecArray | null;
            while (!!(match = regex.exec(html))) {

                const url = match[1];
                const title = match[2];

                if (!!this.filterText && !title.toLowerCase().includes(filterText)) {
                    continue;
                }

                // making result distinct
                if (!result.some(s => s.url === url)) {
                    result.push({ url, title });
                }
            }

            return result;
        });
    }

    private getKeywordsFromTitle(title: string): string[]{

        return title.split(' ').map(w => w.toUpperCase()).filter(w =>
            !!w &&
            !!w.trim() &&
            !w.startsWith('(') &&
            !WordsToExclude.includes(w)
        ).map(w => Mappings[w] ?? w);
    }
}

const PopupTimeout = 8000;

const WordsToExclude = [
    "MICROSOFT",
    "AZURE",
    "WINDOWS",
    "AND",
    "OF",
    "ON",
    "FOR",
    "TO",
    "+",
    "10"
];

const Mappings = {
    "APP": "APPLICATION",
    "APPS": "APPLICATION",
    "APPLICATIONS": "APPLICATION",
    "CONTAINERS": "CONTAINER",
    "DESKTOPS": "DESKTOP",
    "HUBS": "HUB",
    "INSTANCES": "INSTANCE",
    "LABS": "LAB",
    "MACHINES": "MACHINE",
    "SERVICES": "SERVICE",
    "STREAMING": "STREAM",
    "TRANSLATOR": "TRANSLATION"
};

interface INode {
    id: string;
    size: number;
    color?: string;
}

interface ILink {
    source: string;
    target: string;
    label: string;
}

interface IProduct {
    url: string;
    title: string;
}