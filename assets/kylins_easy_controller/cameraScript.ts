import { _decorator, Component, Input, Vec3, input,  game, Node, tween, EventMouse, sys, math, renderer, Camera, view } from 'cc'; 
const { ccclass, property } = _decorator;
 
@ccclass('cameraScript')
export class cameraScript extends Component {

    @property(Component)
    targetNode: Component = null; 
 
    screenCenterX: number;
    screenCenterY: number;

    maxAngle: number = 60;  
    minAngle: number = -60;  
    sensitivity: number = 0.05; 

    private horizontalRotation: number = 0;
    private verticalRotation: number = 0;

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

    update(deltaTime: number) { 
        if(sys.isMobile){
            return;
        } 

        const targetRotation = new Vec3(-this.verticalRotation, -this.horizontalRotation, 0); 
        var rot :Vec3 = new Vec3();
        Vec3.lerp(rot, this.node.eulerAngles, targetRotation, deltaTime * 10);
        // Плавно измените углы с использованием lerp
        this.node.eulerAngles = rot;

        //this.node.setRotationFromEuler(new  Vec3(-this.verticalRotation, -this.horizontalRotation, 0));
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