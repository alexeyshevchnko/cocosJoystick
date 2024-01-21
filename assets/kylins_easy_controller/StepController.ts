import { _decorator, AudioClip, AudioSource, CapsuleCollider, Component, director, game, geometry, math, Node, physics, PhysicsSystem, Quat, random, v3, Vec3 } from 'cc';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { CameraScript } from './CameraScript';
const { ccclass, property } = _decorator;

@ccclass('StepController')
export class StepController extends Component {
    @property(ThirdPersonCamera)
    thirdPersonCamera : ThirdPersonCamera = null;
    @property(CameraScript)
    cameraScript : CameraScript = null;
    @property(AudioSource)
    myAudioSource : AudioSource = null;
    @property(AudioSource)
    myAudioSourceJamp : AudioSource = null;
    @property(AudioClip)  
    footstep1 : AudioClip = null;
    @property(AudioClip)  
    footstep2 : AudioClip = null;
    @property(AudioClip)  
    footstep3 : AudioClip = null;
    @property(AudioClip)  
    footstep4 : AudioClip = null; 
    @property(AudioClip)  
    jampClip : AudioClip = null; 
    @property(AudioClip)  
    landClip : AudioClip = null; 
    @property(Node)
    go : Node = null;
    @property(Node)
    playerNode : Node = null;
    @property
    LookSensitivity: number = 2.0;
    @property
    ShootSensitivity: number = 1.0;
    @property
    Smooth: number = 25;

    _footsteps : AudioClip[] =null;
    _grounded: boolean = false;
    _velocityChange: Vec3 = v3();
    _prevPosition: Vec3 = v3();
    _prevVelocity: Vec3 = v3();
    _originalLocalPos: Vec3 = v3();
    _nextStepTime: number = 0.5;
    _headBobCycle: number = 0;
    _headBobFade: number = 0;
    _springPos: number = 0;
    _springVelocity: number = 0;
    _springElastic: number = 1.1;
    _springDampen: number = 0.8;
    _springVelocityThreshold: number = 0.05;
    _springPositionThreshold: number = 0.05;
    _velocity: Vec3 = v3(); 
    _prevGrounded: boolean = true;
    _flatVelocity: number;
    _strideLengthen: number;
    _bobFactor: number;
    _bobSwayFactor: number;
    _speedHeightFactor: number;
    _xPos: number;
    _yPos: number;
    _xTilt: number;
    _zTilt: number;
    _stepVolume: number;
    _inputX: number;
    _inputY: number;
    _fixedUpdateInterval: number = 0.02; 
    _accumulatedTime: number = 0;
    _targetRot: Vec3 = v3();  
    _targetPos: Vec3 = v3();  
    _lerpSpeed: number = 2.7; 
    _startPos:Vec3 = v3();

    _headStrideSpeedLengthen: number = 0.35;
    _headFrequency: number = 1.5;
    _headHeightSpeedMultiplier: number = 0.35;
    _headSideMovement: number = 0.05;
    _headJumpLandMove: number = 1;
    _headHeight: number = 0.3;
    _headJumpLandTilt: number = 10;
    _headSwayAngle: number = 0.5;

    checkGrounded() {
       
        var oldIsGrounded = this._grounded;

        const worldRay = new geometry.Ray(this.playerNode.position.x, this.playerNode.position.y , this.playerNode.position.z, 0, -1, 0);
        const mask = 0xffffffff;  // Маска слоев для проверки коллизий
        const maxDistance = 1.1;      // Максимальная дистанция для рейкаста
        const queryTrigger = true; // Проверять ли коллайдеры, помеченные как триггеры

        const playerLayer = 2;  // Предположим, что номер слоя PLAYER равен 8
        const invertedPlayerMask = ~playerLayer;
  

        const bResult = PhysicsSystem.instance.raycast(worldRay, mask & invertedPlayerMask, maxDistance, queryTrigger); 
        this._grounded = bResult; 
        
        if(oldIsGrounded && !this._grounded){
            this.PlayFootstepSoundJamp(this.jampClip);
        }

        if(!oldIsGrounded && this._grounded){
            this.PlayFootstepSoundJamp(this.landClip);
        }
    }

    PlayFootstepSoundJamp(clip: AudioClip) { 
        this.myAudioSourceJamp.clip = clip;
        this.myAudioSourceJamp.play(); 
    }

    start(): void {
        this._startPos = this.go.getPosition().clone(); 
        this._footsteps  = [
            this.footstep1,
            this.footstep2,
            this.footstep3,
            this.footstep4
        ]; 
    }

    update(deltaTime: number): void {
        this.checkGrounded();
        this._accumulatedTime += deltaTime;
 
        while (this._accumulatedTime >= this._fixedUpdateInterval) {
            this.fixedUpdate(this._fixedUpdateInterval, this._fixedUpdateInterval);
            this._accumulatedTime -= this._fixedUpdateInterval;
        } 
    }
 
    private fixedUpdate(fixedDeltaTime: number, deltaTime: number): void { 
        //control footsteps volume based on player move speed;
        // we use the actual distance moved as the velocity since last frame, rather than reading
        //the rigidbody's velocity, because this prevents the 'running against a wall' effect.
        let velocity: Vec3 = new Vec3();
        let currentPosition: Vec3 = this.node.position;
        velocity.set(currentPosition.x - this._prevPosition.x, currentPosition.y - this._prevPosition.y, currentPosition.z - this._prevPosition.z);
        velocity.x /= deltaTime;
        velocity.y /= deltaTime;
        velocity.z /= deltaTime; 
        this._velocityChange.set(velocity.x - this._prevVelocity.x, velocity.y - this._prevVelocity.y, velocity.z - this._prevVelocity.z);
        this._prevPosition.set(currentPosition);
        this._prevVelocity.set(velocity);
        
        this._springVelocity -= this._velocityChange.y;	            // input to spring from change in character Y velocity
        this._springVelocity -= this._springPos * this._springElastic;	// elastic spring force towards zero position
        this._springVelocity *= this._springDampen;				    // damping towards zero velocity
        this._springPos += this._springVelocity * deltaTime;			// output to head Y position
        this._springPos = math.clamp(this._springPos, -0.3, 0.3);		// clamp spring distance

        // snap spring values to zero if almost stopped:
        if (Math.abs(this._springVelocity) < this._springVelocityThreshold && Math.abs(this._springPos) < this._springPositionThreshold) {
            this._springVelocity = 0;
            this._springPos = 0;
        }

        // head bob cycle is based on "flat" velocity (i.e. excluding Y)
        this._flatVelocity = new Vec3(velocity.x, 0, velocity.z).length();

        // lengthen stride based on speed (so run bobbing isn't lots of little steps)
        this._strideLengthen = 1 + (this._flatVelocity * this._headStrideSpeedLengthen);

        // increment cycle
        this._headBobCycle += (this._flatVelocity / this._strideLengthen) * (deltaTime / this._headFrequency);

        // actual bobbing and swaying values calculated using Sine wave
        this._bobFactor = Math.sin(this._headBobCycle * Math.PI * 2);
        this._bobSwayFactor = Math.sin(this._headBobCycle * Math.PI * 2 + Math.PI * 0.5); // sway is offset along the sin curve by a quarter-turn in radians
        this._bobFactor = 1 - (this._bobFactor * 0.5 + 1);                                // bob value is brought into 0-1 range and inverted
        this._bobFactor *= this._bobFactor;                                               // bob value is biased towards 0
         
        // fade head bob effect to zero if not moving
        if (new Vec3(velocity.x, 0, velocity.z).length() < 0.1) {
            this._headBobFade = math.lerp(this._headBobFade, 0, deltaTime);
        }
        else {
            this._headBobFade = math.lerp(this._headBobFade, 1, deltaTime);
        } 

        // height of bob is exaggerated based on speed
        this._speedHeightFactor = 1 + (this._flatVelocity * this._headHeightSpeedMultiplier);

        // finally, set the position and rotation values
        this._xPos = -this._headSideMovement * this._bobSwayFactor;
        this._yPos = this._springPos * this._headJumpLandMove + this._bobFactor * this._headHeight * this._headBobFade * this._speedHeightFactor;
        this._xTilt = -this._springPos * this._headJumpLandTilt;
        this._zTilt = this._bobSwayFactor * this._headSwayAngle * this._headBobFade;
 
        this._targetPos = (new Vec3(this._xPos * 3 , this._yPos * 3 , 0)); 
        var lerp =this.go.position.lerp(this._targetPos, this._lerpSpeed * deltaTime);
        this.go.setPosition(lerp.clone()); 
        this.thirdPersonCamera.setStepPos(lerp.clone());
        Vec3.lerp(this._targetRot, this._targetRot, new Vec3( this._xTilt * 3, 0,  this._zTilt * 3),this._lerpSpeed * deltaTime); 
        this.cameraScript.setStepRot( this._targetRot.clone()); 
        
        this.thirdPersonCamera.setStepRot( this._targetRot.clone());
    
        if(this._grounded){
            if (this._headBobCycle > this._nextStepTime){
                // time for next footstep sound:
                this._nextStepTime = this._headBobCycle + 0.6;
                // play footstep sounds
                let randomIndex = Math.floor(Math.random() * this._footsteps.length);
                let randomClip = this._footsteps[randomIndex];
                this.playSounds(randomClip);
            }
        }
    }
 
    playSounds(clip: AudioClip) { 
        this.myAudioSource.clip = clip;
        this.myAudioSource.play(); 
    }
}