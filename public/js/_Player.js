Player = function(game, canvas) {
    // _this est l'accès à la caméraà l'interieur de Player
    var _this = this;

    // Si le tir est activée ou non
    this.weponShoot = false;

    // On ajoute les joueurs
    this.ghostPlayers=[];

    // Le jeu, chargé dans l'objet Player
    this.game = game;

    // La vitesse de course du joueur
    this.speed = 1;

    // La vitesse de mouvement
    this.angularSensibility = 200;

    // Axe de mouvement X et Z
    this.axisMovement = [false,false,false,false];

    window.addEventListener("keyup", function(evt) {
        if(evt.keyCode == 90 || evt.keyCode == 83 || evt.keyCode == 81 || evt.keyCode == 68 ){
            switch(evt.keyCode){
                case 90:
                _this.camera.axisMovement[0] = false;
                break;
                case 83:
                _this.camera.axisMovement[1] = false;
                break;
                case 81:
                _this.camera.axisMovement[2] = false;
                break;
                case 68:
                _this.camera.axisMovement[3] = false;
                break;
            }
            var data={
                axisMovement : _this.camera.axisMovement
            };
            _this.sendNewData(data)
            
        }
    }, false);

    // Quand les touches sont relachés
    window.addEventListener("keydown", function(evt) {
        if(evt.keyCode == 90 || evt.keyCode == 83 || evt.keyCode == 81 || evt.keyCode == 68 ){
            switch(evt.keyCode){
                case 90:
                _this.camera.axisMovement[0] = true;
                break;
                case 83:
                _this.camera.axisMovement[1] = true;
                break;
                case 81:
                _this.camera.axisMovement[2] = true;
                break;
                case 68:
                _this.camera.axisMovement[3] = true;
                break;
                // case 13:
                //     _this.newDeadEnnemy();
                // break;
            }
            var data={
                axisMovement : _this.camera.axisMovement
            };
            _this.sendNewData(data)
        }
        
    }, false);

    // Quand la souris bouge dans la scène
    window.addEventListener("mousemove", function(evt) {
        if(_this.rotEngaged === true){
            _this.camera.playerBox.rotation.y+=evt.movementX * 0.001 * (_this.angularSensibility / 250);
            var nextRotationX = _this.camera.playerBox.rotation.x + (evt.movementY * 0.001 * (_this.angularSensibility / 250));
            if( nextRotationX < degToRad(90) && nextRotationX > degToRad(-90)){
                _this.camera.playerBox.rotation.x+=evt.movementY * 0.001 * (_this.angularSensibility / 250);
            }
            var data={
                rotation : _this.camera.playerBox.rotation
            };
            //console.log(data);
            _this.sendNewData(data)
        }
    }, false);

    // On récupère le canvas de la scène 
    var canvas = this.game.scene.getEngine().getRenderingCanvas();
    
    // Initialisation de la caméra
    this._initCamera(this.game.scene, canvas); 

    // Le joueur doit cliquer dans la scène pour que controlEnabled soit changé
    this.controlEnabled = false;

    // On lance l'event _initPointerLock pour checker le clic dans la scène
    this._initPointerLock(); 
};

Player.prototype = {
    _initCamera : function(scene, canvas) {
        // Math.random nous donne un nombre entre 0 et 1
        let randomPoint = Math.random();

        // randomPoint fais un arrondis de ce chiffre et du nombre de spawnPoints
        randomPoint = Math.round(randomPoint * (this.game.allSpawnPoints.length - 1));

        // On dit que le spawnPoint est celui choisi selon le random plus haut
        this.spawnPoint = this.game.allSpawnPoints[randomPoint];

        var playerBox = BABYLON.Mesh.CreateBox("headMainPlayer", 3, scene);
        // On donne le sawnPoint avec clone() pour que celui ci ne soit pas affécté par le déplacement du joueur
        playerBox.position = this.spawnPoint.clone();
        playerBox.ellipsoid = new BABYLON.Vector3(2, 2, 2);
        playerBox.isPickable = false;

        // On crée la caméra
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
        this.camera.playerBox = playerBox
        this.camera.parent = this.camera.playerBox;

        // Ajout des collisions avec playerBox
        this.camera.playerBox.checkCollisions = true;
        this.camera.playerBox.applyGravity = true;

        // Si le joueur est en vie ou non
        this.isAlive = true;

        // Pour savoir que c'est le joueur principal
        this.camera.isMain = true;

        // On ajoute l'axe de mouvement
        this.camera.axisMovement = [false,false,false,false];

        // On réinitialise la position de la caméra
        //this.camera.setTarget(BABYLON.Vector3.Zero());
        this.game.scene.activeCamera = this.camera;

        var hitBoxPlayer = BABYLON.Mesh.CreateBox("hitBoxPlayer", 3, scene);
        hitBoxPlayer.parent = this.camera.playerBox;
        hitBoxPlayer.scaling.y = 2;
        hitBoxPlayer.isPickable = true;


    },
    _initPointerLock : function() {
        var _this = this;
        
        // Requete pour la capture du pointeur
        var canvas = this.game.scene.getEngine().getRenderingCanvas();
        canvas.addEventListener("click", function(evt) {
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        }, false);

        // Evenement pour changer le paramètre de rotation
        var pointerlockchange = function (event) {
            _this.controlEnabled = (document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas || document.msPointerLockElement === canvas || document.pointerLockElement === canvas);
            if (!_this.controlEnabled) {
                _this.rotEngaged = false;
            } else {
                _this.rotEngaged = true;
            }
        };
        
        // Event pour changer l'état du pointeur, sous tout les types de navigateur
        document.addEventListener("pointerlockchange", pointerlockchange, false);
        document.addEventListener("mspointerlockchange", pointerlockchange, false);
        document.addEventListener("mozpointerlockchange", pointerlockchange, false);
        document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    },
    _checkMove : function(ratioFps){
        // On bouge le player en lui attribuant la caméra
        this._checkUniqueMove(ratioFps,this.camera);
        for (var i = 0; i < this.ghostPlayers.length; i++) {
            // On bouge chaque ghost présent dans ghstPlayers
            this._checkUniqueMove(ratioFps,this.ghostPlayers[i]);
        }
    },
    _checkUniqueMove : function(ratioFps, player) {
        let relativeSpeed = this.speed / ratioFps;
        var playerSelected = player
        // On regarde si c'est un ghost ou non (seul les ghost on un élément head)
        if(playerSelected.head){
            var rotationPoint = playerSelected.head.rotation;
        }else{
            var rotationPoint = playerSelected.playerBox.rotation;
        }
        if(playerSelected.axisMovement[0]){
            forward = new BABYLON.Vector3(
                parseFloat(Math.sin(parseFloat(rotationPoint.y))) * relativeSpeed, 
                0, 
                parseFloat(Math.cos(parseFloat(rotationPoint.y))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(forward);
        }
        if(playerSelected.axisMovement[1]){
            backward = new BABYLON.Vector3(
                parseFloat(-Math.sin(parseFloat(rotationPoint.y))) * relativeSpeed, 
                0, 
                parseFloat(-Math.cos(parseFloat(rotationPoint.y))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(backward);
        }
        if(playerSelected.axisMovement[2]){
            left = new BABYLON.Vector3(
                parseFloat(Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed, 
                0, 
                parseFloat(Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(left);
        }
        if(playerSelected.axisMovement[3]){
            right = new BABYLON.Vector3(
                parseFloat(-Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed, 
                0, 
                parseFloat(-Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(right);
        }
        playerSelected.playerBox.moveWithCollisions(new BABYLON.Vector3(0,(-1.5) * relativeSpeed ,0));
    },
    getDamage : function(damage, whoDamage){
        var damageTaken = damage;
        // Tampon des dégats par l'armure
        if(this.camera.armor > Math.round(damageTaken/2)){
            this.camera.armor -= Math.round(damageTaken/2);
            damageTaken = Math.round(damageTaken/2);
        }else{
            damageTaken = damageTaken - this.camera.armor;
            this.camera.armor = 0;
        }
        // Prise des dégats avec le tampon de l'armure
        if(this.camera.health>damageTaken){
            this.camera.health-=damageTaken;
        }else{
            // Envoie de la mort par le joueur
            this.playerDead(whoDamage)
        }
    },
    // FONCTIONS MULTIJOUEUR
    sendNewData : function(data){
        updateGhost(data);
    },
    sendActualData : function(){
        console.log(this.camera.playerBox.rotation);
        return {
            position  : this.camera.playerBox.position,
            rotation : this.camera.playerBox.rotation,
            axisMovement : this.camera.axisMovement
        }
    },
    updateLocalGhost : function(data){
        ghostPlayers = this.ghostPlayers;
        
        for (var i = 0; i < ghostPlayers.length; i++) {
            if(ghostPlayers[i].idRoom === data.id){
                console.log("(updateLocalGhost)");
                //console.log(data);
                var boxModified = ghostPlayers[i].playerBox;
                // On applique un correctif sur Y, qui semble tre au mauvais endroit
                if(data.position){
                    console.log(" > position : "+data.position.y);
                    boxModified.position = new BABYLON.Vector3(data.position.x,data.position.y,data.position.z);
                }
                if(data.axisMovement){
                    ghostPlayers[i].axisMovement = data.axisMovement;
                }
                if(data.rotation){
                    ghostPlayers[i].head.rotation.y = data.rotation.y;
                }
                /*if(data.axisMovement){
                    ghostPlayers[i].axisMovement = data.axisMovement;
                }*/
            }
            
        }
    }
};