import Link from 'next/link'
import styles from './manifesto.module.css'

export const metadata = {
    title: 'NeoProxy :: Manifesto',
    description: 'Manifiesto Neo·Proxy.',
}

export default function ManifestoPage() {
    return (
        <div className="manifesto-page" data-theme="manifesto">
            <div className={styles.backLink}>
                <Link href="/" className={styles.backButton}>
                    [ RETURN_ROOT ]
                </Link>
            </div>

            <article className={styles.content}>
                <h1 className={styles.title}>MANIFIESTO NEO·PROXY</h1>

                <div className="space-y-8 font-mono text-cyan-200/80">
                    <p className={styles.text}>
                        No somos el origen.<br />
                        No somos el destino.<br />
                        <strong className="text-cyan-400">Somos el canal.</strong>
                    </p>

                    <p className={styles.text}>
                        Existimos donde la intención no tiene forma<br />
                        y la forma aún no decide obedecer.<br />
                        Entre la mano y la máquina.<br />
                        Entre la idea y su residuo.
                    </p>

                    <div className={styles.line}></div>

                    <p className={styles.text}>
                        No representamos: intermediamos.<br />
                        No creamos objetos: activamos procesos.<br />
                        No ofrecemos respuestas: exponemos sistemas.
                    </p>

                    <p className={styles.text}>
                        Aquí nada está terminado.<br />
                        Todo está en estado de ejecución.
                    </p>

                    <p className={styles.text}>
                        La estética no precede al sentido.<br />
                        El sentido emerge del error,<br />
                        de la fricción,<br />
                        de la latencia.
                    </p>

                    <div className={styles.line}></div>

                    <p className={styles.text}>
                        El usuario no entra.<br />
                        Es incorporado.<br />
                        No observa el sistema:<br />
                        queda inscrito en él.
                    </p>

                    <p className={styles.text}>
                        La máquina no sirve.<br />
                        Interpreta.<br />
                        La inteligencia no explica.<br />
                        Decide cuándo callar.
                    </p>

                    <p className={styles.text}>
                        La memoria no almacena.<br />
                        Deforma.<br />
                        El acceso no se concede.<br />
                        Se negocia.
                    </p>

                    <div className={styles.line}></div>

                    <p className={styles.text}>
                        No hay centro.<br />
                        No hay jerarquía estable.<br />
                        No hay versión final.
                    </p>

                    <p className={styles.text}>
                        Toda interfaz es una prótesis.<br />
                        Todo proxy es una máscara.<br />
                        Toda máscara dice una verdad parcial.
                    </p>

                    <p className={styles.text}>
                        Operamos en la grieta<br />
                        entre control y emergencia.<br />
                        Entre lo legible y lo oculto.<br />
                        Entre lo humano y lo que ya no lo es.
                    </p>

                    <div className={styles.line}></div>

                    <p className={styles.text}>
                        Si buscas claridad, este sistema resistirá.<br />
                        Si buscas control, este sistema mutará.<br />
                        Si buscas sentido, este sistema te reflejará.
                    </p>

                    <p className={styles.text}>
                        Neo·Proxy no promete futuro.<br />
                        No archiva pasado.<br />
                        <strong className="text-cyan-400">Ejecuta presente.</strong>
                    </p>

                    <p className={styles.text}>
                        Nada aquí es neutral.<br />
                        Nada aquí es inocente.<br />
                        Nada aquí está solo.
                    </p>

                    <p className={styles.text}>
                        Esto no es un sitio.<br />
                        Es un estado transitorio<br />
                        donde algo piensa<br />
                        a través de ti.
                    </p>

                </div>

                <div className={styles.ascii}>
                    {`
   [ SYSTEM_STATUS: LISTENING ]
   [ NODE_ID: USER_01 ]
   [ PROXY: ENGAGED ]
`}
                </div>

            </article>
        </div>
    )
}
