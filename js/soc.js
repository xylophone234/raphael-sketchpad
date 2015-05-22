(function() {
	var backendUrl = 'http://m.tfedu.net:2300/blackboard/';
	//socket 相关
	var url = "http://m.tfedu.net:33206";
	var socket;
	// 用户相关
	var groupid;
	var userid;
	var role;
	var appid = 'blankboard';
	// 业务逻辑常量
	var commands = {
			ALLOW_DRAW: 'allowDraw',
			ONLY_VIEW: 'onlyView',
			ADD_PATH: 'addPath',
			REMOVE_PATH: 'removePath',
			UNDO: 'undo',
			REDO: 'redo',
			CLEAR: 'clear',
			ADD_PAGE: 'addPage',
			REMOVE_PAGE: 'removePage',
			CHANGE_PAGE: 'changePage',
			FOURCE_UPDATE: 'fourceUpdate'

		}
		// Raphael sketchpad 相关
		// 可以做多页板书，标签切换
		// sketchpads={domid:sketchpad,domid2:sketchpad2}
	var sketchpads = {

	};
	var currentPad;

	//获取url值
	var getUrlParam = function(name) {
		var str = window.location.search.substr(1);
		if (!str) return null;
		var paramStr = str.split('&');
		var params = {};
		for (var i = 0; i < paramStr.length; i++) {
			var keyValue = paramStr[i].split('=');
			if (keyValue[0] == name) return keyValue[1];
		}
		return null;
	}

	var pageCount = 0;
	/**
	 * 新建板书页
	 * @return {[type]} [description]
	 */
	var createNewPage = function() {
			var id = 'editor' + pageCount;
			pageCount++;
			$('#pagecontainer').append('<div id="' + id + '" class="blankboardpage"></div>');
			var sketchpad = Raphael.sketchpad(id, {
				width: 800,
				height: 400,
				editing: true
			})
			sketchpads[id] = sketchpad;
			currentPad = sketchpad;
			console.log(currentPad);


			var onAddPath = function(path) {
				if (path != null) {
					forwardGroupAddPath(groupid, {
						domid: id,
						path: path
					})
				}
			}

			sketchpad.setUpCallback(onAddPath);
		}
		/**
		 * 修改画笔颜色
		 *
		 * @param  {[type]} color '#ff0000'
		 * @return {[type]}       [description]
		 */
	var changeColor = function(color) {
			currentPad.pen().color(color)
		}
		/**
		 * 修改画笔粗细
		 * 1-10
		 * @param  {[type]} thick [description]
		 * @return {[type]}       [description]
		 */
	var changeThick = function(thick) {
			currentPad.pen().width(thick)
		}
		/**
		 * 修改透明度
		 * 0-1
		 * @param  {[type]} alpha [description]
		 * @return {[type]}       [description]
		 */
	var chagneAlpha = function(alpha) {
			currentPad.pen().opacity(alpha)
		}
		/**
		 * 撤销
		 * @return {[type]} [description]
		 */
	var undo = function() {
			currentPad.undo();
			forwardGroupUndo(groupid, {
				domid: currentPad.domid
			});
		}
		/**
		 * [redo description]
		 * @return {[type]} [description]
		 */
	var redo = function() {
			currentPad.redo();
			forwardGroupRedo(groupid, {
				domid: currentPad.domid
			});
		}
		/**
		 * 清空
		 * @return {[type]} [description]
		 */
	var clear = function() {
			currentPad.clear();
			forwardGroupClear(groupid, {
				domid: currentPad.domid
			});
		}
		/**
		 * 更改模式
		 * mode=true 可以绘图
		 * mode=fale 不能绘图，
		 * mode='erase' 橡皮擦模式
		 * @param  {[type]} mode [description]
		 * @return {[type]}      [description]
		 */
	var changeMode = function(mode) {
			currentPad.editing(mode);
		}
		/**
		 * 删除当前页
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
	var deletePage = function(id) {

	}

	var save = function() {
		var name = $('#blackboadInput').val();
		var padList = [];
		for (var domid in sketchpads) {
			padList.push({
				domid: domid,
				strokeList: sketchpads[domid].json()
			})
		}
		$.ajax({
			url: backendUrl,
			type: 'POST',
			data: {
				name: name,
				blackboard: padList
			},
			success: function() {
				console.log('saved ok')
			}
		})
	}



	var initButtonListener = function() {


		$('#newPageButton').click(createNewPage);

		$('#changeColorButton').click(function() {
			changeColor(Math.random() > 0.5 ? '#8800ff' : '#00ff00');
		})

		$('#changeAlphaButton').click(function() {
			chagneAlpha(Math.random())
		});

		$('#changeThickButton').click(function() {
			changeThick(Math.random() * 10 + 2)
		});

		$('#undoButton').click(undo);
		$('#redoButton').click(redo);
		$('#clearButton').click(clear);

		$('#eraserModeButton').click(function() {
			changeMode('erase')
		});
		$('#editModeButton').click(function() {
			changeMode(true)
		});
		$('#viewModeButton').click(function() {
			changeMode(false)
		});

		$('#allowButton').click(function() {
			forwardAllowDraw($("#useridInput").val(), {
				domid: currentPad.domid
			})
		});
		$('#refuseButton').click(function() {
			forwardOnlyView($("#useridInput").val(), {
				domid: currentPad.domid
			})
		});
		$('#saveButton').click(function() {
			save();
		});

	}

	/**
	 * 初始化socket侦听
	 * @return {[type]} [description]
	 */
	var initSocketListener = function() {
		socket.on('connect', function() {
			console.log('connected')
		})
		socket.on('joinGroup', function(data) {
			console.log('joinGroup', data);
			if(role=='teacher'){

			}
		})
		socket.on('leaveGroup', function(data) {
			console.log('leaveGroup', data)
		})
		socket.on('disconnect', function() {
			console.log('disconnected')
		})
		socket.on('forward', function(data) {
			switch (data.command) {
				case commands.ALLOW_DRAW:
					onRemoteAllowDraw(data.params);
					break;
				case commands.ONLY_VIEW:
					onRemoteOnlyView(data.params);
					break;
			}
		})
		socket.on('forwardGroup', function(data) {
			switch (data.command) {
				case commands.ADD_PATH:
					onRemoteAddpath(data.params);
					break;
				case commands.ADD_PAGE:
					onRemoteAddPage(data.params);
					break;
				case commands.CHANGE_PAGE:
					onRemoteChangePage(data.params);
					break;
				case commands.UNDO:
					onRemoteUndo(data.params);
					break;
				case commands.REDO:
					onRemoteRedo(data.params);
					break;
				case commands.CLEAR:
					onRemoteClear(data.params);
					break;
				case commands.REMOVE_PAGE:
					onRemoteRemovePage(data.params);
					break;
				case commands.REMOVE_PATH:
					onRemoteRemvoePath(data.params);
					break;
			}
		})
	}

	// var onUpdataGraph=function(data){
	// 	var pad=sketchpads[data.domid];
	// 	pad.change();
	// 	// pad.clear();
	// 	pad&&pad.strokes(data.graphData);
	// 	pad.change(onchange)
	// }
	/**
	 * 物理连接
	 * 切换用户时强制使用新的物理连接
	 * 断网重连时使用旧的连接，服务器段socket.id不变
	 * @param  {[type]} url      [description]
	 * @param  {[type]} forcenew [强制使用新的物理连接，]
	 * @return {[type]}          [description]
	 */
	var connect = function(forcenew) {
			if (forcenew) {
				socket = io.connect(url, {
					'force new connection': true
				});
			} else {
				socket = io.connect(url);
			}
		}
		/**
		 * 客户端断开连接
		 * @param  {[type]} socket [description]
		 * @return {[type]}        [description]
		 */
	var disconnect = function(socket) {
			socket.disconnect();
		}
		//==================================logic=====================
		/**
		 * 登陆，userid，appid必填
		 * @param  {[string]} userid [description]
		 * @param  {[string]} appid  [description]
		 * @return {[type]}        [description]
		 */
	var login = function(userid, appid) {
			socket.emit('uploadUserid', {
				userid: userid,
				appid: appid
			}, function(data) {
				if (!data.status === 'success') {
					alert(data.message)
				}
			})
		}
		/**
		 * socket可以和任意陌生人通信，这里做了限制，只能和同一个room里的人通信
		 * 互动课堂里，教师和学生都应该在用一个组，例如：用班级id做room
		 * 扩展：可以创建更细的讨论组，如分组绘图
		 * 加入群组，只有在一个群组里的人，才能通信
		 * @param  {[type]} groupid [description]
		 * @return {[type]}         [description]
		 */
	var joinGroup = function(groupid) {
			socket.emit('joinGroup', {
				groupid: groupid
			})
		}
		/**
		 * 群发消息
		 * 将板书群发给所有人
		 * @param  {[type]} toGroupid [description]
		 * @return {[type]}         [description]
		 */
		// var forwardGroupUpdate=function(toGroupid,graphData){
		// 	socket.emit('forwardGroup',{
		// 		groupid:toGroupid,
		// 		appid:appid,
		// 		command:commands.UPDATE_GRAPH,
		// 		data:graphData
		// 	})
		// }

	/**
	 * 新增一条路径
	 * @param  {[type]} toGroupid [description]
	 * @param  {[type]} graphData [description]
	 * @return {[type]}           [description]
	 */
	var forwardGroupAddPath = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.ADD_PATH,
			params: params
		})
	}

	var onRemoteAddpath = function(params) {
		var pad = sketchpads[params.domid];
		if (pad) {
			pad.addPath(params.path);
		}
	}

	var forwardGroupRemovePath = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.REMOVE_PATH,
			params: params
		})
	}

	var onRemoteRemvoePath = function(params) {

	}

	var forwardGroupUndo = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.UNDO,
			params: params
		})
	}

	var onRemoteUndo = function(params) {
		var pad = sketchpads[params.domid];
		pad && pad.undo();
	}

	var forwardGroupRedo = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.REDO,
			params: params
		})
	}

	var onRemoteRedo = function(params) {
		var pad = sketchpads[params.domid];
		pad && pad.redo();
	}

	var forwardGroupClear = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.CLEAR,
			params: params
		})
	}

	var onRemoteClear = function(params) {
		var pad = sketchpads[params.domid];
		pad && pad.clear();
	}

	var forwardGroupAddPage = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.ADD_PAGE,
			params: params
		})
	}

	var onRemoteAddPage = function(params) {

	}

	var forwardGroupRemovePage = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.REMOVE_PAGE,
			params: params
		})
	}

	var onRemoteRemovePage = function(params) {

	}

	var forwardGroupChangePage = function(toGroupid, params) {
		socket.emit('forwardGroup', {
			groupid: toGroupid,
			appid: appid,
			command: commands.CHANGE_PAGE,
			params: params
		})
	}

	var onRemoteChangePage = function(params) {

	}

	/**
	 * 邀请某人协助，被邀请人可以编辑板书
	 * @param  {[type]} userid [description]
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	var forwardAllowDraw = function(userid, params) {
		socket.emit('forward', {
			userid: userid,
			appid: appid,
			command: commands.ALLOW_DRAW,
			params: params
		})
	}

	var onRemoteAllowDraw = function(params) {
		var pad = sketchpads[params.domid];
		pad && pad.editing(true);
	}

	var forwardOnlyView = function(userid, params) {
		socket.emit('forward', {
			userid: userid,
			appid: appid,
			command: commands.ONLY_VIEW,
			params: params
		})
	}

	var onRemoteOnlyView = function(params) {
			var pad = sketchpads[params.domid];
			pad && pad.editing(false);
		}

	var forwardFouceUpdate = function(userid, params) {
		socket.emit('forward', {
			userid: userid,
			appid: appid,
			command: commands.FOURCE_UPDATE,
			params: params
		})
	}

	var forwardGroupFouceUpdate = function(groupid, params) {
		socket.emit('forwardGroup', {
			groupid: groupid,
			appid: appid,
			command: commands.FOURCE_UPDATE,
			params: params
		})
	}

	var onRemoteFouceUpdate = function(blackbordList) {
		$('#pagecontainer').html('');
		for(var i=0;i<blackbordList.length;i++){
			var temp=blackbordList[i];
			createNewPage();
			currentPad.json(temp.path);
		}
	}

	var inviteGroup = function(groupid) {

		}
		/**
		 * 禁止某人编辑，只能看，不能编辑
		 * @param  {[type]} userid [description]
		 * @return {[type]}        [description]
		 */
	var refuse = function(userid) {

		}
		/**
		 * 禁止一组人编辑，该组用户，只能看，不能编辑
		 * 同refuse
		 * @param  {[type]} groupid [description]
		 * @return {[type]}         [description]
		 */
	var refuseGroup = function(groupid) {

	}

	var loadBlackboard = function(blackboardid) {
		$.ajax({
			url: backendUrl + blackboardid,
			success: function(data) {
				for (var i = 0; i < data.blackboard.length; i++) {
					var temp = data.blackboard[i];
					createNewPage();
					currentPad.json(temp.strokeList);
				}
			}
		})
	}

	var init = function() {
		groupid = getUrlParam('groupid');
		userid = getUrlParam('userid');
		role = getUrlParam('role');
		var blackboardid = getUrlParam('blackboardid');
		connect(true);
		initSocketListener();
		initButtonListener();
		login(userid, appid);
		joinGroup(groupid);
		if (blackboardid) {
			loadBlackboard(blackboardid);
		} else {
			$('#newPageButton').trigger('click');
		}

		if (role != 'teacher') {
			// $('#allowButton').hide();
			// $('#refuseButton').hide();
			// $('#useridInput').hide();
			// $('#eraserModeButton').hide();
			// $('#editModeButton').hide();
			// $('#viewModeButton').hide();
		}
	}

	init();



})()