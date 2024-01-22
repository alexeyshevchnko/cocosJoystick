import { _decorator, Component, Input, Vec3, input,  game, Node, tween, EventMouse, sys, math, renderer, Camera, view, v3 } from 'cc'; 
const { ccclass, property } = _decorator;
 
@ccclass('DesktopCamera')
export class DesktopCamera extends Component {

    @property(Component)
    targetNode: Component = null; 
    @property
    tweenTime:number = 0.2;

    _screenCenterX: number;
    _screenCenterY: number;
    _maxAngle: number = 60;  
    _minAngle: number = -60;  
    _sensitivity: number = 0.05; 
    _horizontalRotation: number = 0;
    _verticalRotation: number = 0;
    _pointerLock: boolean =false;
     
    start() {
        if(sys.isMobile){
            return;
        }  
       input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
      
        game.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    onMouseMove(event: MouseEvent) {  
        this._horizontalRotation += event.movementX * this._sensitivity;
        this._verticalRotation += event.movementY * this._sensitivity; 
        this._verticalRotation = math.clamp(this._verticalRotation, this._minAngle, this._maxAngle); 
    }

    _stepRot:Vec3 = v3();
    setStepRot(stepRot:Vec3){
        this._stepRot = stepRot; 
    } 

    update(deltaTime: number) { 
        if(sys.isMobile){ 
            return;
        }  
        const targetRotation = new Vec3(-this._verticalRotation + this._stepRot.x, -this._horizontalRotation, this._stepRot.z);  
        var rot :Vec3 = new Vec3();
        Vec3.lerp(rot, this.node.eulerAngles , targetRotation, deltaTime * 20); 
        this.node.eulerAngles = rot;  
    }

    onMouseDown(event:EventMouse){ 
        if(!this._pointerLock){
            if (game.canvas.requestPointerLock) {
                game.canvas.requestPointerLock();
                this._pointerLock = true;
                window.removeEventListener("mousemove", this.onMouseMove.bind(this));
            } 
        }else{
            if (document.exitPointerLock) {
                document.exitPointerLock();
                this._pointerLock = false;
                window.addEventListener("mousemove", this.onMouseMove.bind(this));
            } 
        }
    }
 
}