import { ReplicatedStorage } from "@rbxts/services"
import { BossClass, ZombieClass } from "./ZombieClass"
import Interval from "shared/ReplicatedStorage/Core/Interval"
import TakeDamage from "shared/ServerScriptService/TakeDamage"
import Zombie from "./Zombie"

export class RotatingBoss<Room extends Model> implements Partial<BossClass<Room>> {
	bossRoom: Room | undefined
	currentPhase: number = -1
	nextPhaseEvent: RemoteEvent
	phaseValue: NumberValue | undefined

	attackInterval: number = 4
	phases: ((self: this) => Promise<void> | void)[][] = []

	constructor() {
		this.nextPhaseEvent = this.NewRemoteEvent("NextPhase")
	}

	AfterSpawn() {
		this.phaseValue = new Instance("NumberValue")
		this.phaseValue.Name = "CurrentPhase"
		this.phaseValue.Value = -1
		this.phaseValue.Parent = (this as unknown as ZombieClass).instance
	}

	InitializeAI() { }

	InitializeBossAI(this: RotatingBoss<Room> & ZombieClass, room: Room) {
		this.bossRoom = room

		this.instance.Humanoid.HealthChanged.Connect((health) => {
			const expectedPhase = -math.ceil(health / (100 / this.phases.size())) + this.phases.size()
			if (this.currentPhase !== expectedPhase && health > 0) {
				this.nextPhaseEvent.FireAllClients()
				this.NextPhase()
			}
		})

		this.NextPhase()
	}

	NextPhase() {
		this.currentPhase += 1
		const currentPhase = this.currentPhase
		const phase = this.phases[currentPhase]
		if (phase === undefined) {
			return
		}

		this.phaseValue!.Value = currentPhase
		let currentSequence = 0

		Interval(this.attackInterval, () => {
			const result = phase[currentSequence](this)
			if (Promise.is(result)) {
				result.await()
			}

			currentSequence = (currentSequence + 1) % phase.size()

			if (this.currentPhase !== currentPhase) {
				return false
			}
		})
	}

	NewRemoteEvent(remoteEventName: string): RemoteEvent {
		const remoteEvent = new Instance("RemoteEvent")
		remoteEvent.Name = remoteEventName
		remoteEvent.Parent = ReplicatedStorage.Remotes.RotatingBoss
		return remoteEvent
	}

	NewDamageSource(remoteEventName: string, damage: number | number[]): RemoteEvent {
		const remoteEvent = this.NewRemoteEvent(remoteEventName)
		remoteEvent.OnServerEvent.Connect((player) => {
			// this is gross, but `this` wouldn't work
			TakeDamage(
				player,
				Zombie.GetDamageAgainstConstant(
					undefined,
					player,
					0,
					typeIs(damage, "number")
						? damage
						: assert(
							damage[this.currentPhase],
							`No damage for ${remoteEventName} specified for phase ${this.currentPhase}`,
						),
				)
			)
		})

		return remoteEvent
	}
}
