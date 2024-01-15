import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('IsMobileActivator')
export class IsMobileActivator extends Component {
    @property
    useInMobile: boolean = true; 

    onLoad() { 
        if(this.useInMobile && sys.isMobile){
            return;
        }

        if(this.useInMobile && !sys.isMobile){
            this.node.active = false;
            return;
        }
 
    

    } 
}


