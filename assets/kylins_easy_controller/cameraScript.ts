import { _decorator, Component, Input, Vec3, input,  game, Node, tween, EventMouse, sys, math, renderer, Camera, view } from 'cc'; 
const { ccclass, property } = _decorator;
 
@ccclass('cameraScript')
export class cameraScript extends Component {

    @property(Component)
    targetNode: Component = null; 

    private mouseXSensitvity: number = 8;
    private mouseYSensitvity: number = 5;
    private mousePos = new Vec3(0, 0, 0); 
    private varStart:number;
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
        
       const canvasSize = view.getCanvasSize();
        this.screenCenterX =canvasSize.width / 2;
        this.screenCenterY = canvasSize.height / 2;

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
        const lerpFactor = 0.1; // Фактор интерполяции
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

    lockChange() {
        if (document.pointerLockElement === game.canvas ) {
            this.varStart = 1;
        } else {
            this.varStart = 3;
          setTimeout( () => { this.varStart = 0; }, 1800 );
        }
    }
 
    onMouseMoveOld(event:EventMouse){ 
        /*
        this.mousePos.x = 330 + event.getLocation().y/this.mouseXSensitvity;
        this.mousePos.y = -event.getLocation().x/this.mouseYSensitvity; 
        console.log("this.mousePos = " + this.mousePos);
        */

        this.horizontalRotation += event.getDeltaX() * this.sensitivity;
        this.verticalRotation += event.getDeltaY() * this.sensitivity;

        // Ограничение угла наклона по вертикали
        this.verticalRotation = math.clamp(this.verticalRotation, this.minAngle, this.maxAngle);

        console.log("event.getDeltaX() : ",  event.getDeltaX());
    }
}