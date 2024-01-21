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

    footsteps : AudioClip[] =null;
    grounded: boolean = false;
    velocityChange: Vec3 = v3();
    prevPosition: Vec3 = v3();
    prevVelocity: Vec3 = v3();
    originalLocalPos: Vec3 = v3();
    nextStepTime: number = 0.5;
    headBobCycle: number = 0;
    headBobFade: number = 0;
    springPos: number = 0;
    springVelocity: number = 0;
    springElastic: number = 1.1;
    springDampen: number = 0.8;
    springVelocityThreshold: number = 0.05;
    springPositionThreshold: number = 0.05;
    velocity: Vec3 = v3(); 
    prevGrounded: boolean = true;
    flatVelocity: number;
    strideLengthen: number;
    bobFactor: number;
    bobSwayFactor: number;
    speedHeightFactor: number;
    xPos: number;
    yPos: number;
    xTilt: number;
    zTilt: number;
    stepVolume: number;
    InputX: number;
    InputY: number;
    fixedUpdateInterval: number = 0.02; 
    accumulatedTime: number = 0;
    targetRot: Vec3 = v3();  
    targetPos: Vec3 = v3();  
    lerpSpeed: number = 2.7; 
    startPos:Vec3 = v3();

    headBobStrideSpeedLengthen: number = 0.35;
    headBobBobFrequency: number = 1.5;
    headBobHeightSpeedMultiplier: number = 0.35;
    headBobBobSideMovement: number = 0.05;
    headBobJumpLandMove: number = 1;
    headBobBobHeight: number = 0.3;
    headBobJumpLandTilt: number = 10;
    headBobBobSwayAngle: number = 0.5;

    checkGrounded() {
       
        var oldIsGrounded = this.grounded;

        const worldRay = new geometry.Ray(this.playerNode.position.x, this.playerNode.position.y , this.playerNode.position.z, 0, -1, 0);
        const mask = 0xffffffff;  // Маска слоев для проверки коллизий
        const maxDistance = 1.1;      // Максимальная дистанция для рейкаста
        const queryTrigger = true; // Проверять ли коллайдеры, помеченные как триггеры

        const playerLayer = 2;  // Предположим, что номер слоя PLAYER равен 8
        const invertedPlayerMask = ~playerLayer;
  

        const bResult = PhysicsSystem.instance.raycast(worldRay, mask & invertedPlayerMask, maxDistance, queryTrigger); 
        this.grounded = bResult; 
        
        if(oldIsGrounded && !this.grounded){
            this.PlayFootstepSoundJamp(this.jampClip);
        }

        if(!oldIsGrounded && this.grounded){
            this.PlayFootstepSoundJamp(this.landClip);
        }
    }

    PlayFootstepSoundJamp(clip: AudioClip) { 
        this.myAudioSourceJamp.clip = clip;
        this.myAudioSourceJamp.play(); 
    }

    start(): void {
        this.startPos = this.go.getPosition().clone(); 
        this.footsteps  = [
            this.footstep1,
            this.footstep2,
            this.footstep3,
            this.footstep4
        ]; 
    }

    update(deltaTime: number): void {
        this.checkGrounded();
        this.accumulatedTime += deltaTime;
 
        while (this.accumulatedTime >= this.fixedUpdateInterval) {
            this.fixedUpdate(this.fixedUpdateInterval, this.fixedUpdateInterval);
            this.accumulatedTime -= this.fixedUpdateInterval;
        } 
    }

    private fixedUpdate(fixedDeltaTime: number, deltaTime: number): void { 
        //control footsteps volume based on player move speed;
        // we use the actual distance moved as the velocity since last frame, rather than reading
        //the rigidbody's velocity, because this prevents the 'running against a wall' effect.
        let velocity: Vec3 = new Vec3();
        let currentPosition: Vec3 = this.node.position;
        velocity.set(currentPosition.x - this.prevPosition.x, currentPosition.y - this.prevPosition.y, currentPosition.z - this.prevPosition.z);
        velocity.x /= deltaTime;
        velocity.y /= deltaTime;
        velocity.z /= deltaTime; 
        this.velocityChange.set(velocity.x - this.prevVelocity.x, velocity.y - this.prevVelocity.y, velocity.z - this.prevVelocity.z);
        this.prevPosition.set(currentPosition);
        this.prevVelocity.set(velocity);
        
        this.springVelocity -= this.velocityChange.y;	            // input to spring from change in character Y velocity
        this.springVelocity -= this.springPos * this.springElastic;	// elastic spring force towards zero position
        this.springVelocity *= this.springDampen;				    // damping towards zero velocity
        this.springPos += this.springVelocity * deltaTime;			// output to head Y position
        this.springPos = math.clamp(this.springPos, -0.3, 0.3);		// clamp spring distance

        // snap spring values to zero if almost stopped:
        if (Math.abs(this.springVelocity) < this.springVelocityThreshold && Math.abs(this.springPos) < this.springPositionThreshold) {
            this.springVelocity = 0;
            this.springPos = 0;
        }

        // head bob cycle is based on "flat" velocity (i.e. excluding Y)
        this.flatVelocity = new Vec3(velocity.x, 0, velocity.z).length();

        // lengthen stride based on speed (so run bobbing isn't lots of little steps)
        this.strideLengthen = 1 + (this.flatVelocity * this.headBobStrideSpeedLengthen);

        // increment cycle
        this.headBobCycle += (this.flatVelocity / this.strideLengthen) * (deltaTime / this.headBobBobFrequency);

        // actual bobbing and swaying values calculated using Sine wave
        this.bobFactor = Math.sin(this.headBobCycle * Math.PI * 2);
        this.bobSwayFactor = Math.sin(this.headBobCycle * Math.PI * 2 + Math.PI * 0.5); // sway is offset along the sin curve by a quarter-turn in radians
        this.bobFactor = 1 - (this.bobFactor * 0.5 + 1);                                // bob value is brought into 0-1 range and inverted
        this.bobFactor *= this.bobFactor;                                               // bob value is biased towards 0
         
        // fade head bob effect to zero if not moving
        if (new Vec3(velocity.x, 0, velocity.z).length() < 0.1)
        {
            this.headBobFade = math.lerp(this.headBobFade, 0, deltaTime);
        }
        else
        {
            this.headBobFade = math.lerp(this.headBobFade, 1, deltaTime);
        } 

        // height of bob is exaggerated based on speed
        this.speedHeightFactor = 1 + (this.flatVelocity * this.headBobHeightSpeedMultiplier);

        // finally, set the position and rotation values
        this.xPos = -this.headBobBobSideMovement * this.bobSwayFactor;
        this.yPos = this.springPos * this.headBobJumpLandMove + this.bobFactor * this.headBobBobHeight * this.headBobFade * this.speedHeightFactor;
        this.xTilt = -this.springPos * this.headBobJumpLandTilt;
        this.zTilt = this.bobSwayFactor * this.headBobBobSwayAngle * this.headBobFade;
 
        this.targetPos = (new Vec3(this.xPos * 3 , this.yPos * 3 , 0));
        
        var lerp =this.go.position.lerp(this.targetPos, this.lerpSpeed * deltaTime);
        this.go.setPosition(lerp.clone()); 

       this.thirdPersonCamera.setStepPos(lerp.clone());
 
        
       
        Vec3.lerp(this.targetRot, this.targetRot, new Vec3( this.xTilt * 3, 0,  this.zTilt * 3),this.lerpSpeed * deltaTime); 
       this.cameraScript.setStepRot( this.targetRot.clone()); 
       
       this.thirdPersonCamera.setStepRot( this.targetRot.clone());
 
       if(this.grounded){
            if (this.headBobCycle > this.nextStepTime){
                // time for next footstep sound:
                this.nextStepTime = this.headBobCycle + 0.6;
                // play footstep sounds
                let randomIndex = Math.floor(Math.random() * this.footsteps.length);
                let randomClip = this.footsteps[randomIndex];
                this.playSounds(randomClip);
            }
        }
    }
 
    playSounds(clip: AudioClip) { 
        this.myAudioSource.clip = clip;
        this.myAudioSource.play(); 
    }
}