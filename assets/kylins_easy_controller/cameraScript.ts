import { _decorator, Component, Input, Vec3, input,  game, Node, tween, EventMouse, sys, math, renderer, Camera, view, v3 } from 'cc'; 
const { ccclass, property } = _decorator;
 
@ccclass('CameraScript')
export class CameraScript extends Component {

    @property(Component)
    targetNode: Component = null; 
 
    screenCenterX: number;
    screenCenterY: number;

    maxAngle: number = 60;  
    minAngle: number = -60;  
    sensitivity: number = 0.05; 

    private horizontalRotation: number = 0;
    private verticalRotation: number = 0;
    @property
    tweenTime:number = 0.2;

    start() {
        if(sys.isMobile){
            return;
        }  
       input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
      
        game.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    onMouseMove(event: MouseEvent) {  
        this.horizontalRotation += event.movementX * this.sensitivity;
        this.verticalRotation += event.movementY * this.sensitivity; 
        this.verticalRotation = math.clamp(this.verticalRotation, this.minAngle, this.maxAngle); 
    }

    _stepRot:Vec3 = v3();
    public setStepRot(stepRot:Vec3){
        this._stepRot = stepRot;
     // this._stepRot = v3();
    }
    
    update(deltaTime: number) { 
        if(sys.isMobile){
            /*
            const targetRotation = new Vec3( this._stepRot.x, 0, this._stepRot.z); 
            var rot :Vec3 = new Vec3();
            Vec3.lerp(rot, this.node.eulerAngles , targetRotation, deltaTime * 20); 
            this.node.eulerAngles = rot;
 
            */
            return;
        } 


        const targetRotation = new Vec3(-this.verticalRotation + this._stepRot.x, -this.horizontalRotation, this._stepRot.z); 

        /*
        const t = Math.min(deltaTime / this.tweenTime, 1.0);
        var v3_1 : Vec3 = v3();
        v3_1.set(this.node.eulerAngles);
        Vec3.lerp(v3_1, v3_1, targetRotation, t *5);
        this.node.setRotationFromEuler(v3_1);
       */
        
        var rot :Vec3 = new Vec3();
        Vec3.lerp(rot, this.node.eulerAngles , targetRotation, deltaTime * 20); 
        this.node.eulerAngles = rot; 
        
    }

    pointerLock: boolean =false;
    //эта хрень выкючает курсор 
    onMouseDown(event:EventMouse){ 
        if(!this.pointerLock){
            if (game.canvas.requestPointerLock) {
                game.canvas.requestPointerLock();
                this.pointerLock = true;
                window.removeEventListener("mousemove", this.onMouseMove.bind(this));
            } 
        }else{
            if (document.exitPointerLock) {
                document.exitPointerLock();
                this.pointerLock = false;
                window.addEventListener("mousemove", this.onMouseMove.bind(this));
            } 
        }
    }
 
}