/**
 * 2Dアクションパック
 * https://github.com/microsoft/pxt-common-packages/blob/master/libs/game
 */
//% weight=150 color=#2D9AFF icon="\uf201" block="2Dアクションパック"
namespace two_dims_action_pack {
    const stateNamespace = "__2d_action_pack";

    type AnimationHandlers = {
        angleHandlerRegistered?: boolean,
        moveHandlerRegistered?: boolean,
        attackHandlerRegistered?: boolean,
        itemHandlerRegistered?: boolean,
    }

    export enum SpriteDirection {
        //% block="右"
        RIGHT = 1,
        //% block="左"
        LEFT = 2
    }
    enum SpriteState {
        IDLE,
        JUMP,
        RUN
    }

    type AnimationData = {
        direction: SpriteDirection,
        state: SpriteState
    }

    type AngleData = {
        direction: SpriteDirection,
        value: number,
        active: boolean
    }

    type MoveData = {
        elaspedTime: number,
        frameInterval: number,
        direction: SpriteDirection,
        currentFrames: Image[],
        rightFrames: Image[],
        rightLastFrame: number,
        rightLastUpdated: number,
        leftFrames: Image[],
        leftLastFrame: number,
        leftLastUpdated: number
    }

    type AttackData = {
        elaspedTime: number,
        frameInterval: number,
        attacking: boolean,
        direction: SpriteDirection,
        lastFrame: number,
        lastUpdated: number,
        rightFrames: Image[],
        leftFrames: Image[],
        rightRunFrames: Image[],
        leftRunFrames: Image[],
        rightJumpFrames: Image[],
        leftJumpFrames: Image[]
    }

    type Sprite2DActionPackData = {
        sprite: Sprite,
        angle?: AngleData,
        move?: MoveData,
        attack?: AttackData,
        items?: Sprite[]
    }

    function getFrame(sprite: Sprite, frame: Image[]) {
        const res: Image[] = []
        frame.forEach((image) => {
            const i = image.clone()
            if (sprite.ay < 0) i.flipY()
            res.push(i)
        })
        return res
    }

    /**
     * スプライトのアニメーションを設定する
     */
    //% block="アニメーションを設定する スプライト $sprite=variables_get(mySprite) アイドル右 $idleRight=animation_editor アイドル左 $idleLeft=animation_editor 間隔(ms) $idleInterval=timePicker 移動右 $runRight=animation_editor 移動左 $runLeft=animation_editor 間隔(ms) $runInterval=timePicker ジャンプ右 $jumpRight=screen_image_picker ジャンプ左 $jumpLeft=screen_image_picker"
    //% runInterval.defl=100
    //% group="スプライト"
    //% weight=110
    export function setSpriteAnimations(
        sprite: Sprite,
        idleRight: Image[], idleLeft: Image[], idleInterval: number,
        runRight: Image[], runLeft: Image[], runInterval: number = 100,
        jumpRight: Image, jumpLeft: Image) {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }

        let data: AnimationData = spriteDicts[sprite.id]
        if (!data) {
            data = { direction: SpriteDirection.RIGHT, state: SpriteState.IDLE }
            const frame = getFrame(sprite, idleRight)
            animation.runImageAnimation(sprite, frame, idleInterval, true)
        }
        game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
            const direction = data.direction
            const state = data.state
            if (Math.abs(sprite.vy) > 0) {  // jumping
                if (state !== SpriteState.JUMP) {
                    animation.stopAnimation(animation.AnimationTypes.All, sprite)
                }
                if (sprite.vx > 0) {
                    data.direction = SpriteDirection.RIGHT
                } else if (sprite.vx < 0) {
                    data.direction = SpriteDirection.LEFT
                }
                if (data.direction === SpriteDirection.RIGHT) {
                    const image = jumpRight.clone()
                    if (sprite.ay < 0) image.flipY()
                    sprite.setImage(image)
                } else if (data.direction === SpriteDirection.LEFT) {
                    const image = jumpLeft.clone()
                    if (sprite.ay < 0) image.flipY()
                    sprite.setImage(image)
                }
                data.state = SpriteState.JUMP
            } else if (Math.abs(sprite.vx) > 0) {   // running
                if (sprite.vx > 0 && (direction !== SpriteDirection.RIGHT || state !== SpriteState.RUN)) {
                    const frame = getFrame(sprite, runRight)
                    animation.runImageAnimation(sprite, frame, runInterval, true)
                    data.direction = SpriteDirection.RIGHT
                } else if (sprite.vx < 0 && (direction !== SpriteDirection.LEFT || state !== SpriteState.RUN)) {
                    const frame = getFrame(sprite, runLeft)
                    animation.runImageAnimation(sprite, frame, runInterval, true)
                    data.direction = SpriteDirection.LEFT
                }
                data.state = SpriteState.RUN
            } else if (state !== SpriteState.IDLE) {
                const hitGround = sprite.ay > 0
                    ? sprite.isHittingTile(CollisionDirection.Bottom)
                    : sprite.isHittingTile(CollisionDirection.Top)
                if (hitGround) {  // idle
                    if (direction === SpriteDirection.RIGHT) {
                        const frame = getFrame(sprite, idleRight)
                        animation.runImageAnimation(sprite, frame, idleInterval, true)
                    } else {
                        const frame = getFrame(sprite, idleLeft)
                        animation.runImageAnimation(sprite, frame, idleInterval, true)
                    }
                    data.state = SpriteState.IDLE
                }
            }
            spriteDicts[sprite.id] = data
        })
    }

    /**
     * 移動アニメーションを設定する
     */
    //% block="移動アニメーションを設定する $sprite=variables_get(mySprite) 右方向 $rightFrames=animation_editor 左方向 $leftFrames=animation_editor フレーム間隔 (ms) $frameInterval=timePicker || 右アイドル$rightIdleImage=screen_image_picker 左アイドル$leftIdleImage=screen_image_picker 右ジャンプ$rightJumpImage=screen_image_picker 左ジャンプ$leftJumpImage=screen_image_picker"
    //% frameInterval.defl=100
    //% expandableArgumentMode="toggle"
    //% group="スプライト"
    //% weight=100
    export function setMoveAnimation(sprite: Sprite, rightFrames: Image[], leftFrames: Image[], frameInterval: number, rightIdleImage?: Image, leftIdleImage?: Image, rightJumpImage?: Image, leftJumpImage?: Image) {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        let handlers = game.currentScene().data[`${stateNamespace}_handlers`] as AnimationHandlers
        if (!handlers || !handlers.moveHandlerRegistered) {
            if (!handlers) handlers = { moveHandlerRegistered: true }
            else handlers.moveHandlerRegistered = true

            game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
                const spriteIds = Object.keys(spriteDicts)
                for (let i = 0; i < spriteIds.length; i++) {
                    const spriteId = spriteIds[i]
                    const data: Sprite2DActionPackData = spriteDicts[spriteId]
                    const sprite = data.sprite
                    if (sprite.vx === 0 && sprite.vy === 0) {
                        if (data.attack && data.attack.attacking) continue

                        let image = data.move.currentFrames[0]
                        if (data.move.direction == SpriteDirection.RIGHT && rightIdleImage) {
                            image = rightIdleImage
                        } else if (data.move.direction == SpriteDirection.LEFT && leftIdleImage) {
                            image = leftIdleImage
                        }
                        if (sprite.image !== image) sprite.setImage(image)
                        data.move.rightLastFrame = 0
                        data.move.leftLastFrame = 0
                        continue
                    }

                    data.move.elaspedTime += game.eventContext().deltaTimeMillis
                    if (Math.abs(sprite.vy) === 0) {
                        if (sprite.vx > 0) {
                            data.move.direction = SpriteDirection.RIGHT
                            const attackFrameAvailable = data.attack && data.attack.attacking && data.attack.rightRunFrames && data.attack.rightRunFrames.length > 0
                            const frameInterval = attackFrameAvailable ? data.attack.frameInterval : data.move.frameInterval
                            const frames = attackFrameAvailable ? data.attack.rightRunFrames : data.move.rightFrames
                            if (data.move.elaspedTime - data.move.rightLastUpdated > frameInterval) {
                                data.move.rightLastUpdated = data.move.elaspedTime
                                data.move.rightLastFrame = (data.move.rightLastFrame + 1) % frames.length
                                const image = frames[data.move.rightLastFrame]
                                if (sprite.image !== image) sprite.setImage(image)
                                data.move.currentFrames = data.move.rightFrames
                            }
                        } else if (sprite.vx < 0) {
                            data.move.direction = SpriteDirection.LEFT
                            const attackFrameAvailable = data.attack && data.attack.attacking && data.attack.leftRunFrames && data.attack.leftRunFrames.length > 0
                            const frameInterval = attackFrameAvailable ? data.attack.frameInterval : data.move.frameInterval
                            const frames = attackFrameAvailable ? data.attack.leftRunFrames : data.move.leftFrames
                            if (data.move.elaspedTime - data.move.leftLastUpdated > frameInterval) {
                                data.move.leftLastUpdated = data.move.elaspedTime
                                data.move.leftLastFrame = (data.move.leftLastFrame + 1) % frames.length
                                const image = frames[data.move.leftLastFrame]
                                if (sprite.image !== image) sprite.setImage(image)
                                data.move.currentFrames = data.move.leftFrames
                            }
                        }
                    } else {
                        sprite.vx > 0 && (data.move.direction = SpriteDirection.RIGHT)
                        sprite.vx < 0 && (data.move.direction = SpriteDirection.LEFT)
                        !(data.attack && data.attack.attacking &&
                            data.attack.rightJumpFrames && data.attack.rightJumpFrames.length > 0) &&
                            data.move.direction == SpriteDirection.RIGHT && rightJumpImage && data.sprite.setImage(rightJumpImage)
                        !(data.attack && data.attack.attacking &&
                            data.attack.leftJumpFrames && data.attack.leftJumpFrames.length > 0) &&
                            data.move.direction === SpriteDirection.LEFT && leftJumpImage && data.sprite.setImage(leftJumpImage)
                    }
                }
            })
        }
        game.currentScene().data[`${stateNamespace}_handlers`] = handlers
        /*
        sprite.onDestroyed(() => {
            delete spriteDicts[sprite.id]
        })
        */
        const data = {
            elaspedTime: 0,
            frameInterval: frameInterval,
            direction: SpriteDirection.RIGHT,
            currentFrames: [sprite.image],
            rightFrames: rightFrames,
            rightLastFrame: 0,
            rightLastUpdated: 0,
            leftFrames: leftFrames,
            leftLastFrame: 0,
            leftLastUpdated: 0

        } as MoveData
        if (spriteDicts[sprite.id]) {
            spriteDicts[sprite.id].move = data
        } else {
            spriteDicts[sprite.id] = {
                sprite: sprite,
                move: data
            } as Sprite2DActionPackData
        }
    }


    function getAttackingSpritePosition(sprite: Sprite, direction: SpriteDirection, offset: number) {
        let x = sprite.x
        let y = sprite.y
        if (direction === SpriteDirection.RIGHT) {
            x = sprite.x + offset
        } else if (direction === SpriteDirection.LEFT) {
            x = x - offset
        }
        return { x: x, y: y }
    }

    /**
     * 攻撃アニメーションを設定する
     */
    //% block="攻撃アニメーションを設定する $sprite=variables_get(mySprite) 右方向 $rightFrames=animation_editor 左方向 $leftFrames=animation_editor フレーム間隔 (ms) $frameInterval=timePicker ||  右移動$rightRunFrames=animation_editor 左移動$leftRunFrames=animation_editor 右ジャンプ$rightJumpFrames=animation_editor 左ジャンプ$leftJumpFrames=animation_editor"
    //% offset.defl=0
    //% frameInterval.defl=100
    //% group="スプライト"
    //% weight=99
    export function setAttackAnimation(sprite: Sprite, rightFrames: Image[], leftFrames: Image[], frameInterval: number, rightRunFrames?: Image[], leftRunFrames?: Image[], rightJumpFrames?: Image[], leftJumpFrames?: Image[]) {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        let handlers = game.currentScene().data[`${stateNamespace}_handlers`] as AnimationHandlers
        if (!handlers || !handlers.attackHandlerRegistered) {
            if (!handlers) handlers = { attackHandlerRegistered: true }
            else handlers.attackHandlerRegistered = true

            game.eventContext().registerFrameHandler(scene.FOLLOW_SPRITE_PRIORITY, () => {
                const spriteIds = Object.keys(spriteDicts)
                for (let i = 0; i < spriteIds.length; i++) {
                    const spriteId = spriteIds[i]
                    const data: Sprite2DActionPackData = spriteDicts[spriteId]
                    const sprite = data.sprite
                    if (Math.abs(sprite.vx) > Math.abs(sprite.vy)) {
                        if (sprite.vx > 0) {
                            data.attack.direction = SpriteDirection.RIGHT
                        } else if (sprite.vx < 0) {
                            data.attack.direction = SpriteDirection.LEFT
                        }
                    }
                }
            })
            game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
                const spriteIds = Object.keys(spriteDicts)
                for (let i = 0; i < spriteIds.length; i++) {
                    const spriteId = spriteIds[i]
                    const data: Sprite2DActionPackData = spriteDicts[spriteId]
                    const sprite = data.sprite
                    if (data.attack && data.attack.attacking) {
                        let frames: Image[] = []
                        if (data.attack.direction === SpriteDirection.RIGHT) {
                            frames = Math.abs(sprite.vy) > 0 && data.attack.rightJumpFrames
                                ? data.attack.rightJumpFrames : data.attack.rightFrames
                        } else if (data.attack.direction === SpriteDirection.LEFT) {
                            frames = Math.abs(sprite.vy) > 0 && data.attack.leftJumpFrames
                                ? data.attack.leftJumpFrames : data.attack.leftFrames
                        }
                        data.attack.elaspedTime += game.eventContext().deltaTimeMillis
                        if (data.attack.elaspedTime - data.attack.lastUpdated > data.attack.frameInterval) {
                            data.attack.lastUpdated = data.attack.elaspedTime
                            data.attack.lastFrame += 1
                            if (data.attack.lastFrame === 0) {
                            }
                            if (data.attack.lastFrame < frames.length) {
                                const image = frames[data.attack.lastFrame]
                                if (data.sprite.image !== image) {
                                    data.sprite.setImage(image)
                                }
                            } else {
                                data.attack.attacking = false
                            }
                        }
                    }
                }
            })
        }
        game.currentScene().data[`${stateNamespace}_handlers`] = handlers
        const data = {
            elaspedTime: 0,
            frameInterval: frameInterval,
            currentFrames: [sprite.image],
            attacking: false,
            direction: SpriteDirection.RIGHT,
            lastFrame: -1,
            lastUpdated: 0,
            rightFrames: rightFrames,
            leftFrames: leftFrames,
            rightRunFrames: rightRunFrames,
            leftRunFrames: leftRunFrames,
            rightJumpFrames: rightJumpFrames,
            leftJumpFrames: leftJumpFrames
        } as AttackData
        if (spriteDicts[sprite.id]) {
            spriteDicts[sprite.id].attack = data
        } else {
            spriteDicts[sprite.id] = {
                sprite: sprite,
                attack: data
            } as Sprite2DActionPackData
        }
        /*
        sprite.onDestroyed(() => {
            delete spriteDicts[sprite.id]
        })
        */
    }

    /**
     * 攻撃アニメーションを開始する
     */
    //% block="$sprite=variables_get(mySprite) の攻撃アニメーションを開始する"
    //% group="スプライト"
    //% weight=98
    export function attack(sprite: Sprite) {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        const data = spriteDicts[sprite.id] as Sprite2DActionPackData
        
        if (!data || !data.attack) return
        
        data.attack.attacking = true
        data.attack.lastFrame = -1
        data.attack.lastUpdated = 0
    }

    /**
     * スプライトの向きを確認する
     */
    //% block="$sprite=variables_get(mySprite) が右を向いている"
    //% group="スプライト"
    //% weight=97
    export function isSpriteTowardToRight(sprite: Sprite): boolean {
        if (!sprite) return false

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        const data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.move) return false

        return data.move.direction === SpriteDirection.RIGHT
    }

    /*
     * スプライトを点滅させる 
     */
    //% block="スプライト %sprite を %t ミリ秒間点滅させる||点滅間隔 %interval"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% t.defl=1000
    //% interval.defl=50
    //% group="スプライト"
    //% weight=96
    export function blinkSprite(sprite: Sprite, t: number, interval?: number) {
        let invisible = false;
        const i = setInterval(() => {
            invisible = !invisible;
            sprite.setFlag(SpriteFlag.Invisible, invisible);
        }, interval);
        setTimeout(() => {
            clearInterval(i);
            sprite.setFlag(SpriteFlag.Invisible, false);
        }, t);
    }

    /**
     * タイル上にスプライトを生成する
     */
    //% block="スプライト%sprite=screen_image_picker (%kind=spritekind タイプ)をタイル%tile 上に生成する || (速度 vx:%vx , vy:%vy, 加速度 ax:%ax , ay:%ay) タイル除去 %removeTile=toggleOnOff"
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% vx.defl=0
    //% vy.defl=0
    //% ax.defl=0
    //% ay.defl=0
    //% removeTile.defl=true
    //% group="スプライト"
    //% weight=95
    export function spawnSpritesOnTiles(sprite: Image, kind: number, tile: Image, vx: number = 0, vy: number = 0, ax: number = 0, ay: number = 0, removeTile: boolean = true) {
        tiles.getTilesByType(tile).forEach(tLoc => {
            const s = sprites.create(sprite, kind)
            tiles.placeOnTile(s, tLoc)
            removeTile && tiles.setTileAt(tLoc, img`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
`)
            s.setVelocity(vx, vy)
            s.ax = ax
            s.ay = ay
            s.setBounceOnWall(true)
        })
    }

    /**
     * Kind単位で物理量を設定する
     */
    /*
    //% block="%kind=spritekind タイプのを %value にする"
    //% group="スプライト"
    //% weight=93
    export function setKindValue(kind: number, value: number) {
        const spritesByKind = game.currentScene().spritesByKind;
        let sprites = []:
        if (!(kind >= 0) || !spritesByKind[kind]) sprites = [];
        else sprites = spritesByKind[kind].sprites();

        sprites.forEach((sprite) => {
            sprite.
        });
    }
    */

    /**
     * 2スプライト間の距離を取得する
     */
    //% block="%sprite1=variables_get(mySprite) と%sprite2=variables_get(mySprite2) の間の距離"
    //% group="スプライト"
    //% weight=90
    export function distanceBetween(sprite1: Sprite, sprite2: Sprite): number {
        return Math.sqrt((sprite1.x - sprite2.x) ** 2 + (sprite1.y - sprite2.y) ** 2);
    }

    function _existsWallsBetween(scene: scene.Scene, x1: number, y1: number, x2: number, y2: number): boolean {
        const diffX = x2 - x1;
        const diffY = y2 - y1;
        if (Math.abs(diffX) > 240 || Math.abs(diffY) > 240) return false;
        const dist = Math.sqrt(diffX ** 2 + diffY ** 2);
        const step = dist / scene.tileMap.scale * 0.5;
        const angle = Math.atan(diffY / diffX) + (diffX < 0 ? Math.PI : 0);
        for (let d = 0; d < dist; d += step) {
            const x = x1 + d * Math.cos(angle);
            const y = y1 + d * Math.sin(angle);
            const loc = tiles.getTileLocation(x >> scene.tileMap.scale, y >> scene.tileMap.scale);
            if (tiles.tileAtLocationIsWall(loc)) return true;
        }
        return false;
    }

    /**
     * 2スプライト間に壁が存在するか確認する
     */
    //% block="%sprite1=variables_get(mySprite) と%sprite2=variables_get(mySprite2) の間に壁が存在する || 画面外もチェックする %checkOutOfScreen"
    //% checkOutOfScreen.defl=false
    //% checkOutOfScreen.shadow=toggleOnOff
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% group="スプライト"
    //% weight=85
    export function existWallsBetween(sprite1: Sprite, sprite2: Sprite, checkOutOfScreen?: boolean): boolean {
        const scene = game.currentScene();
        if (!scene.tileMap) return true;
        if (!checkOutOfScreen && (sprite1.isOutOfScreen(scene.camera) || sprite2.isOutOfScreen(scene.camera))) return true;
        const sprite1HInset = sprite1.width * 0.2;
        const sprite1VInset = sprite1.height * 0.2;
        const sprite2HInset = sprite2.width * 0.2;
        const sprite2VInset = sprite2.height * 0.2;
        return _existsWallsBetween(scene, sprite1.left + sprite1HInset, sprite1.top + sprite1VInset, sprite2.left + sprite2HInset, sprite2.top + sprite2VInset) ||
            _existsWallsBetween(scene, sprite1.right - sprite1HInset, sprite1.top + sprite1VInset, sprite2.right - sprite2HInset, sprite2.top + sprite2VInset) ||
            _existsWallsBetween(scene, sprite1.right - sprite1HInset, sprite1.bottom - sprite1VInset, sprite2.right - sprite2HInset, sprite2.bottom - sprite2VInset) ||
            _existsWallsBetween(scene, sprite1.left + sprite1HInset, sprite1.bottom - sprite1VInset, sprite2.left + sprite2HInset, sprite2.bottom - sprite2VInset);
    }

    /**
     * スプライトが他のスプライトを追跡しているか確認する
     */
    //% block="%following=variables_get(myEnemy) が%followed=variables_get(mySprite) を追跡している"
    //% group="スプライト"
    //% weight=85
    export function isFollowingSprite(following: Sprite, followed: Sprite): boolean {
        const sc = game.currentScene();
        if (!sc.followingSprites) return false;
        let isFollowing = false;
        sc.followingSprites.forEach(fs => {
            const { target, self, turnRate, rate } = fs;
            if (self.id === following.id && target.id === followed.id) isFollowing = true;
        });
        return isFollowing;
    }


    /**
     * スプライトを追跡を停止する
     */
    //% block="%following=variables_get(myEnemy) の追跡を終了する || 動き続ける %keepMoving"
    //% keepMoving.defl=true
    //% keepMoving.shadow=toggleOnOff
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% group="スプライト"
    //% weight=80
    export function stopFollowing(sprite: Sprite, keepMoving?: boolean) {
        const sc = game.currentScene();
        if (!sc.followingSprites) return;

        const fs = sc.followingSprites.find(fs => fs.self.id == sprite.id);
        if (!fs) return;

        const speed = fs.rate;
        let vx = keepMoving ? fs.self.vx : 0;
        let vy = keepMoving ? fs.self.vy : 0;
        if (keepMoving && (vx ** 2 + vy ** 2) < speed ** 2 * 0.5) {
            const angle = 2 * Math.PI * Math.random();
            vx = speed * Math.cos(angle);
            vy = speed * Math.sin(angle);
        }
        sprite.vx = vx;
        sprite.vy = vy;
        sc.followingSprites.removeElement(fs);
    }


    /**
     * HPステータスバーをスプライトに設定する
     */
    //% block="HPステータスバーをスプライト%sprite=variables_get(mySprite) に設定する || (幅: %width , 高さ: %height, オフセット: %offset)"
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% width.defl=20
    //% height.defl=4
    //% offset.defl=4
    //% group="HPステータスバー"
    //% weight=94
    export function setHPStatusBarToSprite(sprite: Sprite, width: number = 20, height: number = 4, offset: number = 4) {
        let statusbar = statusbars.create(width, height, StatusBarKind.Health)
        statusbar.attachToSprite(sprite)
        statusbar.setOffsetPadding(0, offset)
    }

    /**
     * HPステータスバーをスプライトタイプに設定する
     */
    //% block="HPステータスバーをスプライトタイプ %kind=spritekind に設定する || (幅: %width , 高さ: %height, オフセット: %offset)"
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% width.defl=20
    //% height.defl=4
    //% offset.defl=4
    //% group="HPステータスバー"
    //% weight=93
    export function setHPStatusBarToSpriteKind(kind: number, width: number = 20, height: number = 4, offset: number = 4) {
        const allSprites = sprites.allOfKind(kind)
        for (let i = 0; i < allSprites.length; i++) {
            const sprite = allSprites[i]
            let statusbar = statusbars.create(width, height, StatusBarKind.Health)
            statusbar.attachToSprite(sprite)
            statusbar.setOffsetPadding(0, offset)
        }
    }

    /**
     * スプライトのHPステータスバーの値を変える
     */
    //% block="スプライト%sprite=variables_get(mySprite) のHPステータスバーの値を%value だけ変える"
    //% value.defl=-10
    //% group="HPステータスバー"
    //% weight=92
    export function changeHPStatusBarValue(sprite: Sprite, value: number = -10) {
        let statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, sprite)
        if (statusbar) {
            if (value > 0) {
                statusbar.value = Math.min(100, statusbar.value + value)
            } else {
                statusbar.value = Math.max(0, statusbar.value + value)
            }
        }
    }

    /**
     * HPステータスバーがゼロになったとき
     */
    //% block="HPステータスバーがゼロになったとき"
    //% draggableParameters="reporter"
    //% group="HPステータスバー"
    //% weight=91
    export function onHPStatusBarZero(handler: (sprite: Sprite, kind: number) => void) {
        const dataKey = `${stateNamespace}_on_hp_zero`
        let handlers = game.currentScene().data[dataKey] as ((sprite: Sprite, spriteKind: number) => void)[]
        if (!handlers) {
            handlers = game.currentScene().data[dataKey] = [] as ((sprite: Sprite, spriteKind: number) => void)[]
        }
        handlers.push(handler)
    }

    statusbars.onZero(StatusBarKind.Health, (statusbar: StatusBarSprite) => {
        const dataKey = `${stateNamespace}_on_hp_zero`
        const handlers = (game.currentScene().data[dataKey] || []) as ((sprite: Sprite, spriteKind: number) => void)[]
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i]
            const sprite = statusbar.spriteAttachedTo()
            handler(sprite, sprite.kind());
        }
    })

    function alignItems(items: Sprite[]) {
        const itemLeft = info.hasLife() ? Math.round(32 + (Math.log(info.life()) / Math.log(10) + 1) * 5) : 8
        let x = itemLeft
        let y = 8
        const scale = 0.6
        const gap = 6
        items.forEach((item) => {
            item.setPosition(x, y)
            item.setScale(scale, ScaleAnchor.Middle)
            item.setFlag(SpriteFlag.RelativeToCamera, true)
            x += item.width * scale + gap
            if (x > screen.width * 0.85) {
                x = itemLeft
                y += 12
            }
        })
    }

    /**
     * スプライトにアイテムを追加する
     */
    //% block="スプライト%sprite=variables_get(mySprite) にアイテム%item=variables_get(item)を追加する"
    //% group="アイテム管理"
    //% weight=89
    export function addItemToSprite(sprite: Sprite, item: Sprite) {
        if (!sprite || !item) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData | undefined
        if (data) {
            if (data.items && data.items.indexOf(item) < 0) {
                data.items.push(item)
            } else {
                data.items = [item]
            }
        } else {
            data = {
                sprite: sprite,
                items: [item]
            }
        }
        spriteDicts[sprite.id] = data

        let handlers = game.currentScene().data[`${stateNamespace}_handlers`] as AnimationHandlers
        if (!handlers || !handlers.itemHandlerRegistered) {
            if (!handlers) handlers = { itemHandlerRegistered: true }
            else handlers.itemHandlerRegistered = true

            game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
                alignItems(data.items);
            })
        }
        game.currentScene().data[`${stateNamespace}_handlers`] = handlers
    }


    /**
     * スプライトにアイテムがアイテムを保持しているかチェックする (Spriteでチェックする)
     */
    //% block="スプライト%sprite=variables_get(mySprite) が%item=variables_get(item) をアイテムとして保持している"
    //% group="アイテム管理"
    //% weight=88
    export function spriteHasSpriteItem(sprite: Sprite, itemSprite: Sprite): boolean {
        if (!sprite || !itemSprite) return false;

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return false
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return false

        let hasItem = false
        data.items.forEach((item: Sprite) => {
            if (item === itemSprite) hasItem = true
        })
        return hasItem
    }


    /**
     * スプライトがアイテムを保持しているかチェックする (kindでチェックする)
     */
    //% block="スプライト%sprite=variables_get(mySprite) が%kind=spritekind タイプのアイテムを保持している"
    //% group="アイテム管理"
    //% weight=87
    export function spriteHasItem(sprite: Sprite, kind: number): boolean {
        if (!sprite) return false;

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return false
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return false

        let hasItem = false
        data.items.forEach((item: Sprite) => {
            if (item.kind() === kind) hasItem = true
        })
        return hasItem
    }


    /**
     * スプライトの保持アイテムからアイテムを削除する (Sprite指定)
     */
    //% block="スプライト%sprite=variables_get(mySprite) の保持アイテムからアイテム%itemSprite=variables_get(item) を削除する"
    //% group="アイテム管理"
    //% weight=86
    export function deleteItemSprite(sprite: Sprite, itemSprite: Sprite): void {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return

        const deleteIndex: number[] = [];
        data.items.forEach((item: Sprite, index: number) => {
            if (item === itemSprite) {
                item.destroy()
                deleteIndex.push(index)
            }
        })
        deleteIndex.reverse()
        for (const i of deleteIndex) {
            data.items.splice(i, 1)
        }
        spriteDicts[sprite.id] = data
    }


    /**
     * スプライトの保持アイテムからアイテムを削除する (kind指定)
     */
    //% block="スプライト%sprite=variables_get(mySprite) の保持アイテムから%kind=spritekind タイプのアイテムを削除する"
    //% group="アイテム管理"
    //% weight=85
    export function deleteItem(sprite: Sprite, kind: number): void {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return

        const deleteIndex: number[] = [];
        data.items.forEach((item: Sprite, index: number) => {
            if (item.kind() === kind) {
                item.destroy()
                deleteIndex.push(index)
            }
        })
        deleteIndex.reverse()
        for (const i of deleteIndex) {
            data.items.splice(i, 1)
        }

        alignItems(data.items)
        spriteDicts[sprite.id] = data
    }


    /**
     * スプライトの上下左右のタイルの位置を取得する
     */
    //% block="スプライト%sprite=variables_get(mySprite) の%direction方向のタイルの位置"
    //% group="タイルマップ"
    //% weight=70
    export function getTileAt(sprite: Sprite, direction: CollisionDirection): tiles.Location {
        const tileMap = game.currentScene().tileMap
        const loc = sprite.tilemapLocation()
        const col = loc.col + (direction === CollisionDirection.Left ? -1 : (direction === CollisionDirection.Right ? 1 : 0))
        const row = loc.row + (direction === CollisionDirection.Top ? -1 : (direction === CollisionDirection.Bottom ? 1 : 0))
        return new tiles.Location(col, row, tileMap)
    }
}