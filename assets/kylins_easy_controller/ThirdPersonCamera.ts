import { _decorator, Component, Node, Vec3, v3, sys, math, UITransform, Input, __private, EventTouch, Quat } from 'cc';
import { EasyController, EasyControllerEvent } from './EasyController';
import { UI_Joystick } from './UI_Joystick';
const { ccclass, property } = _decorator;

const v3_1 = v3();
const v3_2 = v3();

const ROTATION_STRENGTH = 20.0;

@ccclass('ThirdPersonCamera')
export class ThirdPersonCamera extends Component {
    @property(Node)
    target: Node;

    @property
    lookAtOffset: Vec3 = v3();

    @property
    zoomSensitivity: number = 1.0;

    @property
    lenMin: number = 1.0;

    @property
    lenMax: number = 10.0;

    @property
    len: number = 5;

    @property
    rotateVHSeparately: boolean = false;

    @property
    tweenTime:number = 0.2;

    @property
    useLen:boolean = false;

    private _targetLen: number = 0;
    private _targetAngles: Vec3 = v3();

    @property(UITransform)
    checkerCamera:UITransform = null;

    @property(UITransform)
    checkerMovement:UITransform = null;


    start() {
        EasyController.on(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);
        EasyController.on(EasyControllerEvent.CAMERA_ZOOM, this.onCameraZoom, this);

        this._targetLen = this.len;
        this._targetAngles.set(this.node.eulerAngles);
 
        this.checkerCamera.node.on(Input.EventType.TOUCH_START, this.onTouchDown_rotate, this); 
        this.checkerCamera.node.on(Input.EventType.TOUCH_END, this.onTouchUp_rotate, this);
        this.checkerCamera.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_rotate, this);

        this.checkerMovement.node.on(Input.EventType.TOUCH_START, this.onTouchDown_movement, this); 
        this.checkerMovement.node.on(Input.EventType.TOUCH_END, this.onTouchUp_movement, this);
        this.checkerMovement.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_movement, this); 
    }
 


    onDestroy() {
        EasyController.off(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);
        EasyController.off(EasyControllerEvent.CAMERA_ZOOM, this.onCameraZoom, this);

        this.checkerCamera.node.off(Input.EventType.TOUCH_START, this.onTouchDown_rotate, this); 
        this.checkerCamera.node.off(Input.EventType.TOUCH_END, this.onTouchUp_rotate, this);
        this.checkerCamera.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchUp_rotate, this);

        this.checkerMovement.node.off(Input.EventType.TOUCH_START, this.onTouchDown_movement, this); 
        this.checkerMovement.node.off(Input.EventType.TOUCH_END, this.onTouchUp_movement, this);
        this.checkerMovement.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchUp_movement, this); 
    }

    isClickRotate : boolean = false;
    isClickMove : boolean = false;
    deltaTime: number = 0;

    lateUpdate(deltaTime: number) {
        this.deltaTime = deltaTime;
        if (!this.target) {
            return;
        }
        const t = Math.min(deltaTime / this.tweenTime, 1.0);
        //rotation
        v3_1.set(this.node.eulerAngles);
        Vec3.lerp(v3_1, v3_1, this._targetAngles, t);


        if(sys.isMobile){
            //TODO! only tach screen
            this.node.setRotationFromEuler(v3_1);

           
          if(this.isClickMove && !this.isClickRotate){
                const targetRotation = new Vec3(this.node.eulerAngles.x + this._stepRot.x, this.node.eulerAngles.y + this._stepRot.z, 0); 
                var rot :Vec3 = new Vec3();
                Vec3.lerp(rot, this.node.eulerAngles , targetRotation, t*5);//deltaTime * 20); 
                this.node.eulerAngles = rot;
          } else{
                if(this.isClickMove && this.isClickRotate){
                    const targetRotation = new Vec3(this.node.eulerAngles.x , this.node.eulerAngles.y + this._stepRot.z, 0); 
                    var rot :Vec3 = new Vec3();
                    Vec3.lerp(rot, this.node.eulerAngles , targetRotation, t*5);//deltaTime * 20); 
                    this.node.eulerAngles = rot;
                }
          }
        
        }

        //lookat
        v3_1.set(this.target.worldPosition);
        v3_1.add(this.lookAtOffset);

        //len and position
        this.len = 0;
        if(this.useLen){
            this.len = this.len * (1.0 - t) + this._targetLen * t;  
        }

        v3_2.set(this.node.forward);
        v3_2.multiplyScalar(this.len);

        v3_1.subtract(v3_2);
        
        this.node.setPosition(v3_1.clone().add(this._stepPos));

      
    } 

    _stepPos:Vec3 = v3();
    public setStepPos(stepPos:Vec3){
        this._stepPos = stepPos;
    }

    _stepRot:Vec3 = v3();
    public setStepRot(stepRot:Vec3){
        this._stepRot = stepRot;
    }
 

    onCameraRotate(deltaX: number, deltaY: number) {
        let eulerAngles = this.node.eulerAngles;
        if (this.rotateVHSeparately) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                deltaY = 0;
            }
            else {
                deltaX = 0;
            }
        }
        
 

        var x = math.clamp((eulerAngles.x   ) + deltaX * ROTATION_STRENGTH, -60, 60); 
        this._targetAngles.set(
            x  , 
            (eulerAngles.y  ) + deltaY * ROTATION_STRENGTH , 
            eulerAngles.z );    

            /*

        if(this.isClickMove && this.isClickRotate){
            const t = Math.min(this.deltaTime / this.tweenTime, 1.0);
            const targetRotation = new Vec3(this._targetAngles.x + this._stepRot.x, this._targetAngles.y + this._stepRot.z, 0); 
            var rot :Vec3 = new Vec3();
            Vec3.lerp(rot, this._targetAngles , targetRotation, t*5);//deltaTime * 20); 
            this.node.eulerAngles = rot;
        }*/
    }

    onTouchDown_rotate(event: EventTouch) { 
        this.isClickRotate = true;
    }

    onTouchUp_rotate(event: EventTouch) { 
        this.isClickRotate = false;
    }

    onTouchDown_movement(event: EventTouch) { 
        this.isClickMove = true;
    }
    onTouchUp_movement(event: EventTouch) { 
        this.isClickMove = false;
    }

    onCameraZoom(delta: number) {
        this._targetLen += delta * this.zoomSensitivity;
        if (this._targetLen < this.lenMin) {
            this._targetLen = this.lenMin;
        }
        if (this._targetLen > this.lenMax) {
            this._targetLen = this.lenMax;
        }
    }
}

